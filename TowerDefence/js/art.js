// Circuit Siege art: everything is drawn on canvas here, no image files.
// The board is a circuit board; bugs crawl along a copper track from the PORT to the CPU.
var Art = (function () {
  'use strict';
  var W = 960, H = 540;
  var PATH = [[-30, 100], [200, 100], [200, 260], [440, 260], [440, 90], [720, 90], [720, 300], [560, 300], [560, 450], [110, 450]];
  var CPU = { x: 60, y: 450, s: 70 };
  var TRACK = 34;

  var TOWER_COL = { pulse: '#8ab4f8', fan: '#78d9ec', surge: '#fdd663', laser: '#ff8bcb' };

  function seeded(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

  function drawBoard(ctx) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0c1d1a'); g.addColorStop(1, '#0a1614');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r = seeded(7);
    // faint background traces
    ctx.strokeStyle = 'rgba(120, 200, 170, .08)'; ctx.lineWidth = 2;
    for (var i = 0; i < 46; i++) {
      var x = Math.round(r() * W / 20) * 20, y = Math.round(r() * H / 20) * 20, len = 40 + r() * 120;
      ctx.beginPath(); ctx.moveTo(x, y);
      if (r() < .5) { ctx.lineTo(x + len, y); ctx.lineTo(x + len + 20, y + 20); } else { ctx.lineTo(x, y + len); ctx.lineTo(x + 20, y + len + 20); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120, 200, 170, .12)';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
    }
    // little surface parts
    for (i = 0; i < 14; i++) {
      var px = 30 + r() * (W - 60), py = 20 + r() * (H - 40);
      ctx.fillStyle = 'rgba(200, 220, 210, .05)';
      ctx.fillRect(px, py, 18, 8);
    }
    // the track: dark edge, copper, shine
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    line(ctx, PATH, TRACK + 8, '#06100e');
    line(ctx, PATH, TRACK, '#8a5a2b');
    line(ctx, PATH, TRACK - 10, '#a8703a');
    ctx.setLineDash([6, 14]);
    line(ctx, PATH, 2, 'rgba(255, 220, 170, .35)');
    ctx.setLineDash([]);
    // the port the bugs come out of
    ctx.fillStyle = '#2e3440'; ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
    ctx.fillRect(0, 74, 26, 52); ctx.strokeRect(0, 74, 26, 52);
    ctx.fillStyle = '#9aa0a6'; ctx.font = '700 11px Figtree, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('PORT', 6, 68);
    drawCpu(ctx);
  }

  function drawCpu(ctx) {
    var x = CPU.x, y = CPU.y, s = CPU.s, h = s / 2, i;
    ctx.strokeStyle = '#c9cdd4'; ctx.lineWidth = 3;
    for (i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * 12, y - h - 8); ctx.lineTo(x + i * 12, y - h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + i * 12, y + h); ctx.lineTo(x + i * 12, y + h + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h - 8, y + i * 12); ctx.lineTo(x - h, y + i * 12); ctx.stroke();
    }
    ctx.fillStyle = '#1d2128'; ctx.strokeStyle = '#8ab4f8'; ctx.lineWidth = 3;
    roundRect(ctx, x - h, y - h, s, s, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252a33'; roundRect(ctx, x - 20, y - 20, 40, 40, 4); ctx.fill();
    ctx.fillStyle = '#8ab4f8'; ctx.font = '800 15px Figtree, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CPU', x, y + 1); ctx.textBaseline = 'alphabetic';
  }

  function line(ctx, pts, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---- bugs
  function drawEnemy(ctx, e, t) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.dir);
    var wig = Math.sin(t * 18 + e.id) * 2.2, r = e.r, i;
    if (e.slowT > 0) { ctx.shadowColor = '#78d9ec'; ctx.shadowBlur = 10; }
    if (e.type === 'worm') {
      for (i = 3; i >= 0; i--) {
        ctx.fillStyle = i === 0 ? '#fdd663' : (i % 2 ? '#c9a93e' : '#e0bd4c');
        ctx.beginPath(); ctx.arc(-i * r * 1.1, Math.sin(t * 12 + i + e.id) * 2.5, r * (1 - i * .12), 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#0b0d11'; ctx.beginPath(); ctx.arc(r * .4, -r * .35, 1.8, 0, 7); ctx.arc(r * .4, r * .35, 1.8, 0, 7); ctx.fill();
    } else if (e.type === 'trojan' || e.type === 'rootkit') {
      var boss = e.type === 'rootkit';
      ctx.strokeStyle = boss ? '#f28b82' : '#fcad70'; ctx.lineWidth = 2;
      for (i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * r * .5, -r * .7); ctx.lineTo(i * r * .5 + wig, -r * 1.25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * r * .5, r * .7); ctx.lineTo(i * r * .5 - wig, r * 1.25); ctx.stroke();
      }
      ctx.fillStyle = boss ? '#5c1f1b' : '#7a4a22';
      ctx.beginPath();
      for (i = 0; i < 6; i++) { var a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * .85); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = boss ? 'rgba(242,139,130,.6)' : 'rgba(252,173,112,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-r * .6, 0); ctx.lineTo(r * .6, 0); ctx.moveTo(0, -r * .7); ctx.lineTo(0, r * .7); ctx.stroke();
      if (boss) {
        ctx.fillStyle = '#f28b82';
        for (i = 0; i < 6; i++) { a = i * Math.PI / 3 + Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .7); ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.1); ctx.lineTo(Math.cos(a + .3) * r * .8, Math.sin(a + .3) * r * .7); ctx.fill(); }
        ctx.fillStyle = '#fdd663'; ctx.beginPath(); ctx.arc(r * .55, 0, 4, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#fcad70'; ctx.beginPath(); ctx.arc(r * .75, -3, 2, 0, 7); ctx.arc(r * .75, 3, 2, 0, 7); ctx.fill();
      }
    } else {
      var col = e.type === 'swarm' ? '#c58af9' : '#f28b82';
      ctx.strokeStyle = col; ctx.lineWidth = e.type === 'swarm' ? 1.2 : 1.6;
      for (i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * r * .5, -r * .5); ctx.lineTo(i * r * .5 + (i ? wig : -wig), -r * 1.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * r * .5, r * .5); ctx.lineTo(i * r * .5 - (i ? wig : -wig), r * 1.2); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(r * .9, -2); ctx.lineTo(r * 1.5, -r * .7); ctx.moveTo(r * .9, 2); ctx.lineTo(r * 1.5, r * .7); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(-r * .15, 0, r, r * .72, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.lineTo(r * .5, 0); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.stroke();
      ctx.fillStyle = '#3a1512'; ctx.beginPath(); ctx.arc(r * .75, 0, r * .4, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (e.hp < e.maxHp) {
      var bw = Math.max(18, e.r * 2);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 12, bw, 4);
      ctx.fillStyle = '#81c995'; ctx.fillRect(e.x - bw / 2, e.y - e.r - 12, bw * Math.max(0, e.hp / e.maxHp), 4);
    }
  }

  // ---- towers
  function drawTower(ctx, type, x, y, lv, ang, t, scale) {
    var s = scale || 1, col = TOWER_COL[type], i;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // pad with pins
    ctx.strokeStyle = '#c9b06a'; ctx.lineWidth = 2;
    for (i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 9, -22); ctx.lineTo(i * 9, -18); ctx.moveTo(i * 9, 18); ctx.lineTo(i * 9, 22);
      ctx.moveTo(-22, i * 9); ctx.lineTo(-18, i * 9); ctx.moveTo(18, i * 9); ctx.lineTo(22, i * 9); ctx.stroke();
    }
    ctx.fillStyle = '#1d2128'; ctx.strokeStyle = col; ctx.lineWidth = 2;
    roundRect(ctx, -18, -18, 36, 36, 6); ctx.fill(); ctx.stroke();
    if (type === 'pulse') {
      ctx.save(); ctx.rotate(ang);
      ctx.fillStyle = '#2e3440'; ctx.fillRect(0, -4, 20, 8);
      ctx.fillStyle = col; ctx.fillRect(14, -4, 6, 8); ctx.restore();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b1a33'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    } else if (type === 'fan') {
      ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.stroke();
      ctx.save(); ctx.rotate(t * 9);
      ctx.fillStyle = col;
      for (i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(7, 0, 7, 3.2, .5, 0, 7); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#1d2128'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill();
    } else if (type === 'surge') {
      ctx.fillStyle = '#2e3440'; roundRect(ctx, -10, -13, 20, 26, 5); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(-10, -6, 20, 3); ctx.fillRect(-10, 3, 20, 3);
      ctx.fillStyle = '#0b1a33'; ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 11); ctx.lineTo(5, -1); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(-5, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 11); ctx.stroke();
    } else if (type === 'laser') {
      ctx.save(); ctx.rotate(ang);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
      ctx.fillRect(8, -10, 3, 20);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(22, 0); ctx.stroke();
      ctx.restore();
    }
    // level pips
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = i < lv ? col : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.arc(-8 + i * 8, 27, 2.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function towerIcon(type) {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64; c.className = 'cs-icon';
    var g = c.getContext('2d');
    drawTower(g, type, 32, 30, 1, -0.6, 0.3, 1.15);
    return c;
  }

  return { W: W, H: H, PATH: PATH, CPU: CPU, TRACK: TRACK, COL: TOWER_COL, drawBoard: drawBoard, drawEnemy: drawEnemy, drawTower: drawTower, towerIcon: towerIcon, roundRect: roundRect };
})();
