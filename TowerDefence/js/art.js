// Circuit Siege art: everything is drawn on canvas here, no image files.
// The board is a circuit board; bugs crawl along a copper track from the PORT to the CPU.
var Art = (function () {
  'use strict';
  var D = window.CSData;
  var W = D.W, H = D.H, PATH = D.PATH, CPU = D.CPU, TRACK = D.TRACK;

  var COL = { pulse: '#8ab4f8', spark: '#fdd663', router: '#81c995', surge: '#fcad70', pins: '#c9cdd4', cryo: '#78d9ec', mortar: '#f28b82',
    fuse: '#f28b82', lag: '#c58af9', booster: '#a8c7fa', patch: '#c58af9', drone: '#e8eaed', hydro: '#4fc3f7', aicore: '#ff8bcb',
    quantum: '#fde293', farm: '#81c995', cursor: '#f6aea9', printer: '#d7aefb' };

  function seeded(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(ctx, pts, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  function drawBoard(ctx) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0c1d1a'); g.addColorStop(1, '#0a1614');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r = seeded(7), i;
    ctx.strokeStyle = 'rgba(120, 200, 170, .08)'; ctx.lineWidth = 2;
    for (i = 0; i < 46; i++) {
      var x = Math.round(r() * W / 20) * 20, y = Math.round(r() * H / 20) * 20, len = 40 + r() * 120;
      ctx.beginPath(); ctx.moveTo(x, y);
      if (r() < .5) { ctx.lineTo(x + len, y); ctx.lineTo(x + len + 20, y + 20); } else { ctx.lineTo(x, y + len); ctx.lineTo(x + 20, y + len + 20); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120, 200, 170, .12)'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
    }
    for (i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(200, 220, 210, .05)'; ctx.fillRect(30 + r() * (W - 60), 20 + r() * (H - 40), 18, 8); }
    // coolant channels (water towers only)
    D.WATER.forEach(function (w) {
      ctx.fillStyle = '#0d2c3d'; roundRect(ctx, w.x - 4, w.y - 4, w.w + 8, w.h + 8, 14); ctx.fill();
      var lg = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
      lg.addColorStop(0, '#0f4c6e'); lg.addColorStop(1, '#136f8f');
      ctx.fillStyle = lg; roundRect(ctx, w.x, w.y, w.w, w.h, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(160, 230, 255, .35)'; ctx.lineWidth = 2; roundRect(ctx, w.x, w.y, w.w, w.h, 10); ctx.stroke();
      ctx.strokeStyle = 'rgba(200, 245, 255, .18)'; ctx.lineWidth = 2;
      for (var k = 0; k < 8; k++) {
        var wx = w.x + 12 + r() * Math.max(4, w.w - 44), wy = w.y + 16 + r() * (w.h - 26);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 8, wy - 4, wx + 16, wy); ctx.quadraticCurveTo(wx + 24, wy + 4, wx + 32, wy); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(200, 245, 255, .55)'; ctx.font = '700 11px Figtree, sans-serif'; ctx.textAlign = 'left';
      if (w.w > w.h) ctx.fillText('COOLANT', w.x + 10, w.y + 14);
      else { ctx.save(); ctx.translate(w.x + 26, w.y + 12); ctx.rotate(Math.PI / 2); ctx.fillText('COOLANT', 0, 0); ctx.restore(); }
    });
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    line(ctx, PATH, TRACK + 8, '#06100e');
    line(ctx, PATH, TRACK, '#8a5a2b');
    line(ctx, PATH, TRACK - 10, '#a8703a');
    ctx.setLineDash([6, 14]); line(ctx, PATH, 2, 'rgba(255, 220, 170, .35)'); ctx.setLineDash([]);
    ctx.fillStyle = '#2e3440'; ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
    ctx.fillRect(0, 54, 26, 52); ctx.strokeRect(0, 54, 26, 52);
    ctx.fillStyle = '#9aa0a6'; ctx.font = '700 11px Figtree, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('PORT', 4, 48);
    drawCpu(ctx);
  }

  function drawCpu(ctx) {
    var x = CPU.x, y = CPU.y, s = CPU.s, h = s / 2, i;
    ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 3;
    for (i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * 12, y - h - 8); ctx.lineTo(x + i * 12, y - h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + i * 12, y + h); ctx.lineTo(x + i * 12, y + h + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + h, y + i * 12); ctx.lineTo(x + h + 8, y + i * 12); ctx.stroke();
    }
    ctx.fillStyle = '#1d2128'; ctx.strokeStyle = '#8ab4f8'; ctx.lineWidth = 3;
    roundRect(ctx, x - h, y - h, s, s, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252a33'; roundRect(ctx, x - 20, y - 20, 40, 40, 4); ctx.fill();
    ctx.fillStyle = '#8ab4f8'; ctx.font = '800 15px Figtree, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CPU', x, y + 1); ctx.textBaseline = 'alphabetic';
  }

  // ---------------------------------------------------------------- enemies (pre-drawn sprites, facing right)
  var BODY = { glitch: '#ef5350', bug: '#42a5f5', worm: '#66bb6a', spam: '#ffd54f', popup: '#f48fb1', trojan: '#263238', fever: '#eceff1',
    packet: '#90a4ae', hybrid: '#eceff1', poly: '#ab47bc', rootkit: '#2e7d32', ransom: '#a1662f', botnet: '#4f6d8a', mega: '#8e2b2b' };
  var sprites = {};
  function legs(g, r, col) {
    g.strokeStyle = col; g.lineWidth = Math.max(1.2, r / 7);
    for (var i = -1; i <= 1; i++) {
      g.beginPath(); g.moveTo(i * r * .45, -r * .55); g.lineTo(i * r * .45 + i * 2, -r * 1.15); g.stroke();
      g.beginPath(); g.moveTo(i * r * .45, r * .55); g.lineTo(i * r * .45 + i * 2, r * 1.15); g.stroke();
    }
  }
  function makeSprite(type) {
    var e = D.ENEMIES[type], r = e.r, pad = Math.ceil(r * 1.4 + 4), c = document.createElement('canvas');
    c.width = c.height = pad * 2;
    var g = c.getContext('2d'), col = BODY[type], i, a;
    g.translate(pad, pad);
    if (e.zep) {
      var L = r * 1.25;
      g.fillStyle = col; g.strokeStyle = type === 'mega' ? '#ff8a80' : '#b0c4de'; g.lineWidth = 3;
      roundRect(g, -L, -r * .62, L * 2, r * 1.24, r * .6); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-L * .7, 0); g.lineTo(L * .7, 0); g.moveTo(-L * .2, -r * .4); g.lineTo(L * .3, r * .4); g.moveTo(-L * .2, r * .4); g.lineTo(L * .3, -r * .4); g.stroke();
      g.fillStyle = type === 'mega' ? '#ffcdd2' : '#e3f2fd';
      [[-L * .7, 0], [L * .7, 0], [-L * .2, -r * .4], [L * .3, r * .4], [-L * .2, r * .4], [L * .3, -r * .4]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], r * .12, 0, 7); g.fill(); });
      g.fillStyle = '#fdd663'; g.beginPath(); g.arc(L * .95, 0, r * .14, 0, 7); g.fill();
      sprites[type] = { c: c, h: pad };
      return;
    }
    if (type === 'worm') {
      for (i = 3; i >= 0; i--) { g.fillStyle = i % 2 ? '#43a047' : col; g.beginPath(); g.arc(-i * r * .75 + r * .5, 0, r * (0.75 - i * .1), 0, 7); g.fill(); }
      g.fillStyle = '#0b0d11'; g.beginPath(); g.arc(r * .8, -r * .28, 1.8, 0, 7); g.arc(r * .8, r * .28, 1.8, 0, 7); g.fill();
      sprites[type] = { c: c, h: pad }; return;
    }
    legs(g, r, type === 'trojan' ? '#90a4ae' : type === 'fever' ? '#ffab91' : 'rgba(0,0,0,.55)');
    if (type === 'spam') {
      g.fillStyle = col; roundRect(g, -r, -r * .7, r * 2, r * 1.4, 3); g.fill();
      g.strokeStyle = '#7a5c00'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-r, -r * .7); g.lineTo(0, r * .15); g.lineTo(r, -r * .7); g.stroke();
    } else if (type === 'popup') {
      g.fillStyle = col; roundRect(g, -r, -r * .8, r * 2, r * 1.6, 3); g.fill();
      g.fillStyle = '#ad1457'; g.fillRect(-r, -r * .8, r * 2, r * .45);
      g.fillStyle = '#fff'; g.font = '800 ' + Math.round(r) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 0, r * .25);
    } else if (type === 'trojan' || type === 'hybrid') {
      g.fillStyle = col; g.beginPath();
      for (i = 0; i < 6; i++) { a = i * Math.PI / 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * .9); }
      g.closePath(); g.fill();
      if (type === 'hybrid') { g.save(); g.clip(); g.fillStyle = '#212121'; for (i = -3; i <= 3; i += 2) g.fillRect(i * r / 3.5, -r, r / 3.5, r * 2); g.restore(); }
      g.strokeStyle = '#90a4ae'; g.lineWidth = 1.5; g.beginPath();
      for (i = 0; i < 6; i++) { a = i * Math.PI / 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * .9); }
      g.closePath(); g.stroke();
    } else if (type === 'packet') {
      g.fillStyle = col; roundRect(g, -r, -r * .8, r * 2, r * 1.6, 3); g.fill();
      g.strokeStyle = '#eceff1'; g.lineWidth = 1.5; roundRect(g, -r, -r * .8, r * 2, r * 1.6, 3); g.stroke();
      g.strokeStyle = '#263238'; g.lineWidth = 2; g.beginPath(); g.arc(0, -r * .1, r * .32, Math.PI, 0); g.stroke();
      g.fillStyle = '#263238'; g.fillRect(-r * .42, -r * .1, r * .84, r * .6);
    } else if (type === 'ransom') {
      g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r, r * .85, 0, 0, 7); g.fill();
      g.strokeStyle = '#ffcc80'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#ffcc80'; g.font = '800 ' + Math.round(r * 1.05) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 1);
    } else {
      if (type === 'poly') {
        var rg = g.createLinearGradient(-r, 0, r, 0);
        ['#ef5350', '#ffd54f', '#66bb6a', '#42a5f5', '#ab47bc'].forEach(function (cc, k) { rg.addColorStop(k / 4, cc); });
        g.fillStyle = rg;
      } else g.fillStyle = col;
      g.beginPath(); g.ellipse(-r * .1, 0, r, r * .75, 0, 0, 7); g.fill();
      if (type === 'fever') { g.strokeStyle = '#ff7043'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-r * .6, -r * .3); g.lineTo(r * .3, -r * .3); g.moveTo(-r * .6, r * .3); g.lineTo(r * .3, r * .3); g.stroke(); }
      if (type === 'rootkit') { g.strokeStyle = '#a5d6a7'; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.beginPath(); g.ellipse(-r * .1, 0, r, r * .75, 0, 0, 7); g.stroke(); g.setLineDash([]); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-r, 0); g.lineTo(r * .4, 0); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(r * .7, 0, r * .38, 0, 7); g.fill();
    }
    sprites[type] = { c: c, h: pad };
  }

  function drawEnemy(ctx, e) {
    var sp = sprites[e.t]; if (!sp) { makeSprite(e.t); sp = sprites[e.t]; }
    var c = Math.cos(e.dir), s = Math.sin(e.dir);
    if (e.def.camo) ctx.globalAlpha = 0.6;
    ctx.setTransform(c, s, -s, c, e.x, e.y);
    ctx.drawImage(sp.c, -sp.h, -sp.h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (e.frozen > 0) { ctx.fillStyle = 'rgba(160, 230, 255, .45)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, 7); ctx.fill(); }
    else if (e.glue > 0) { ctx.strokeStyle = 'rgba(197, 138, 249, .9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, 7); ctx.stroke(); }
    if (e.def.hits && e.hp < e.def.hits) {
      var bw = Math.max(20, e.r * 2);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 12, bw, 4);
      ctx.fillStyle = '#81c995'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 12, bw * e.hp / e.def.hits, 4);
    }
  }

  // ---------------------------------------------------------------- towers
  function drawTower(ctx, type, x, y, lv, ang, t, scale) {
    var s = scale || 1, col = COL[type], i, a;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (type === 'pins' || type === 'patch' || type === 'fuse') { drawItem(ctx, type, 0, 0, t); ctx.restore(); return; }
    ctx.strokeStyle = '#c9b06a'; ctx.lineWidth = 2;
    for (i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 9, -22); ctx.lineTo(i * 9, -18); ctx.moveTo(i * 9, 18); ctx.lineTo(i * 9, 22);
      ctx.moveTo(-22, i * 9); ctx.lineTo(-18, i * 9); ctx.moveTo(18, i * 9); ctx.lineTo(22, i * 9); ctx.stroke();
    }
    ctx.fillStyle = type === 'hydro' ? '#14384a' : '#1d2128'; ctx.strokeStyle = col; ctx.lineWidth = 2;
    roundRect(ctx, -18, -18, 36, 36, type === 'hydro' ? 18 : 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.strokeStyle = col;
    if (type === 'pulse' || type === 'quantum' || type === 'cursor' || type === 'hydro') {
      ctx.save(); ctx.rotate(ang);
      ctx.fillStyle = '#2e3440'; ctx.fillRect(0, -4, type === 'hydro' ? 24 : 20, 8);
      if (type === 'cursor') { ctx.fillRect(0, -9, 18, 4); ctx.fillRect(0, 5, 18, 4); }
      ctx.fillStyle = col; ctx.fillRect(14, -4, 6, 8); ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, type === 'quantum' ? 11 : 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b1a33'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
      if (type === 'quantum') { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 15, 5, t * 2, 0, 7); ctx.stroke(); }
    } else if (type === 'spark') {
      for (i = 0; i < 8; i++) { a = i * Math.PI / 4; ctx.fillRect(Math.cos(a) * 10 - 2, Math.sin(a) * 10 - 2, 4, 4); }
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
    } else if (type === 'router') {
      ctx.save(); ctx.rotate(ang); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-4, 0, 10, -1.2, 1.2); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    } else if (type === 'surge') {
      ctx.fillStyle = '#2e3440'; roundRect(ctx, -10, -13, 20, 26, 5); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-10, -6, 20, 3); ctx.fillRect(-10, 3, 20, 3);
      ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 11); ctx.lineTo(5, -1); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill();
    } else if (type === 'cryo') {
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.stroke();
      ctx.save(); ctx.rotate(t * 6);
      for (i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(7, 0, 7, 3.2, .5, 0, 7); ctx.fill(); }
      ctx.restore();
    } else if (type === 'mortar') {
      ctx.fillStyle = '#2e3440'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, -6); ctx.moveTo(-9, -12); ctx.lineTo(-4, -6); ctx.moveTo(9, -12); ctx.lineTo(4, -6); ctx.stroke();
    } else if (type === 'lag') {
      ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#2e3440'; ctx.fillRect(0, -5, 20, 10); ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d2128'; ctx.font = '800 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ms', 0, 1); ctx.textBaseline = 'alphabetic';
    } else if (type === 'booster') {
      ctx.lineWidth = 2.5;
      for (i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 8, i * 5, -Math.PI * .8, -Math.PI * .2); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 8, 2.5, 0, 7); ctx.fill();
    } else if (type === 'drone') {
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
      for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(i < 2 ? -10 : 10, i % 2 ? -10 : 10, 4, 0, 7); ctx.stroke(); }
    } else if (type === 'aicore') {
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d2128'; ctx.font = '800 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AI', 0, 1); ctx.textBaseline = 'alphabetic';
    } else if (type === 'farm') {
      for (i = 0; i < 3; i++) { ctx.fillStyle = '#2e3440'; ctx.fillRect(-12, -12 + i * 8, 24, 6); ctx.fillStyle = col; ctx.fillRect(6, -10 + i * 8, 3, 2); }
    } else if (type === 'printer') {
      ctx.fillStyle = '#2e3440'; roundRect(ctx, -13, -8, 26, 14, 3); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-8, 4, 16, 8); ctx.fillRect(-9, -13, 18, 5);
    }
    for (i = 0; i < 4; i++) {
      ctx.fillStyle = i < lv - 1 ? col : 'rgba(255,255,255,.14)';
      ctx.beginPath(); ctx.arc(-12 + i * 8, 28, 2.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function drawItem(ctx, type, x, y, t) {
    if (type === 'patch') {
      ctx.fillStyle = 'rgba(197, 138, 249, .75)'; ctx.beginPath(); ctx.ellipse(x, y, 13, 9, .3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 9, y - 6, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x - 10, y + 5, 3, 0, 7); ctx.fill();
    } else if (type === 'fuse') {
      ctx.fillStyle = '#2e3440'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f28b82'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#fdd663'; ctx.beginPath(); ctx.moveTo(x + 5, y - 6); ctx.lineTo(x + 10, y - 13); ctx.stroke();
      if (Math.sin(t * 20) > 0) { ctx.fillStyle = '#fdd663'; ctx.beginPath(); ctx.arc(x + 10, y - 13, 2.5, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = type === 'hot' ? '#ff8a65' : '#c9cdd4';
      for (var i = 0; i < 5; i++) {
        var a = i * 1.257, px = x + Math.cos(a) * 6, py = y + Math.sin(a) * 6;
        ctx.beginPath(); ctx.moveTo(px, py - 4); ctx.lineTo(px + 3, py + 3); ctx.lineTo(px - 3, py + 3); ctx.closePath(); ctx.fill();
      }
    }
  }

  function towerIcon(type) {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64; c.className = 'cs-icon';
    drawTower(c.getContext('2d'), type, 32, 30, 1, -0.6, 0.3, 1.15);
    return c;
  }
  function enemyIcon(type) {
    var c = document.createElement('canvas');
    c.width = 56; c.height = 56; c.className = 'cs-icon';
    if (!sprites[type]) makeSprite(type);
    var sp = sprites[type], g = c.getContext('2d'), k = Math.min(1, 52 / (sp.h * 2));
    g.translate(28, 28); g.scale(k, k); g.drawImage(sp.c, -sp.h, -sp.h);
    return c;
  }

  return { W: W, H: H, COL: COL, drawBoard: drawBoard, drawEnemy: drawEnemy, drawTower: drawTower, drawItem: drawItem,
    towerIcon: towerIcon, enemyIcon: enemyIcon, roundRect: roundRect };
})();
