// Binary Addition Rules effects: confetti on a canvas and the rainbow sweep. Nothing here blocks input
// (pointer-events: none) and nothing waits on an animation frame to change the game.
var Fx = (function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var COLORS = ['#8ab4f8', '#81c995', '#fdd663', '#f28b82', '#c58af9', '#78d9ec', '#fcad70', '#ff8bcb'];
  var canvas = null, ctx = null, parts = [], running = false, dpr = 1;

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    size();
    window.addEventListener('resize', size);
  }
  function size() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  function add(x, y, vx, vy) {
    parts.push({
      x: x, y: y, vx: vx, vy: vy, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0, max: 110 + Math.random() * 70, round: Math.random() < 0.3
    });
  }
  // A burst from a point (page coordinates in the viewport).
  function burst(x, y, n) {
    ensure();
    n = reduce ? Math.ceil(n / 4) : n;
    var speed = reduce ? 3 : 9;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.75);
      add(x, y, Math.cos(a) * s, Math.sin(a) * s - (reduce ? 1 : 4));
    }
    start();
  }
  // Pieces falling from the top across the whole window.
  function shower(n) {
    ensure();
    n = reduce ? Math.ceil(n / 5) : n;
    for (var i = 0; i < n; i++) add(Math.random() * window.innerWidth, -20 - Math.random() * window.innerHeight * 0.6, (Math.random() - 0.5) * 2, 1 + Math.random() * 3);
    start();
  }
  function start() {
    if (running) return;
    running = true;
    step();
  }
  function next() {
    // A hidden page never runs animation frames; fall back to a timer so the canvas still clears.
    if (document.hidden || !window.requestAnimationFrame) setTimeout(step, 33);
    else window.requestAnimationFrame(step);
  }
  function step() {
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var g = reduce ? 0.06 : 0.22;
    parts = parts.filter(function (p) {
      p.life++;
      p.vy += g; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      var fade = Math.max(0, 1 - Math.max(0, p.life - p.max * 0.6) / (p.max * 0.4));
      if (fade <= 0 || p.y > window.innerHeight + 40) return false;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x * dpr, p.y * dpr);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * dpr / 2, 0, 6.28); ctx.fill(); }
      else ctx.fillRect(-p.w * dpr / 2, -p.h * dpr / 2, p.w * dpr, p.h * dpr * (0.4 + 0.6 * Math.abs(Math.cos(p.life / 6))));
      ctx.restore();
      return true;
    });
    if (parts.length) next();
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }
  function centre(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, seen: r.bottom > 0 && r.top < window.innerHeight };
  }
  function confettiAt(el, n) { var c = centre(el); burst(c.x, c.y, n || 60); }

  // The rainbow: a colour-cycling border round the window, a light sweep across it and a rainbow title.
  var rainbowTimer = null;
  function rainbow(ms) {
    var layer = document.querySelector('.rainbow-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'rainbow-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = '<div class="rainbow-edge"></div><div class="rainbow-sweep"></div>';
      document.body.appendChild(layer);
    }
    document.documentElement.classList.remove('rainbow-on');
    void layer.offsetWidth;
    document.documentElement.classList.add('rainbow-on');
    clearTimeout(rainbowTimer);
    rainbowTimer = setTimeout(function () { document.documentElement.classList.remove('rainbow-on'); }, ms);
  }

  return { reduce: reduce, burst: burst, shower: shower, confettiAt: confettiAt, centre: centre, rainbow: rainbow };
})();
