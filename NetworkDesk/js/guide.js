// Network Help Desk: the training-call guide. A card says what to do; a flashing box and an arrow show the one thing to
// click; everything else on the page is covered so only that thing can be clicked. main.js works out the step from the
// game state each frame and calls show(step); show(null) takes the guide away.
//   step = { title, text, rect: {x, y, w, h} in page pixels, or null with wait: true (nothing to click, just wait) }
export function createGuide() {
  const root = document.createElement('div');
  root.id = 'guide'; root.hidden = true;
  root.innerHTML = '<div class="g-block"></div><div class="g-block"></div><div class="g-block"></div><div class="g-block"></div>' +
    '<div class="g-ring"></div><div class="g-arrow" aria-hidden="true"></div>' +
    '<div class="g-card" role="status" aria-live="polite"><div class="g-title"></div><div class="g-text"></div></div>';
  document.body.append(root);
  const [bt, bb, bl, br] = root.querySelectorAll('.g-block'), ring = root.querySelector('.g-ring'), arrow = root.querySelector('.g-arrow');
  const card = root.querySelector('.g-card'), title = root.querySelector('.g-title'), text = root.querySelector('.g-text');
  const put = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = Math.max(0, w) + 'px'; el.style.height = Math.max(0, h) + 'px'; };
  let lastText = '';
  function show(step) {
    if (!step) { root.hidden = true; lastText = ''; return; }
    root.hidden = false;
    if (step.text !== lastText) { lastText = step.text; title.textContent = step.title || ''; text.textContent = step.text; card.classList.remove('g-new'); void card.offsetWidth; card.classList.add('g-new'); }
    const W = innerWidth, H = innerHeight;
    if (!step.rect) {
      put(bt, 0, 0, W, H); put(bb, 0, 0, 0, 0); put(bl, 0, 0, 0, 0); put(br, 0, 0, 0, 0);
      ring.hidden = arrow.hidden = true; card.style.top = Math.round(H * 0.32) + 'px'; card.style.bottom = ''; return;
    }
    // the hole: at least 56 px each way, so small things are easy to hit
    const r = step.rect, pad = 10, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const w = Math.max(56, r.w + pad * 2), h = Math.max(56, r.h + pad * 2), x = cx - w / 2, y = cy - h / 2;
    put(bt, 0, 0, W, y); put(bb, 0, y + h, W, H - y - h); put(bl, 0, y, x, h); put(br, x + w, y, W - x - w, h);
    ring.hidden = arrow.hidden = false; put(ring, x - 4, y - 4, w + 8, h + 8);
    // the arrow points at the hole from above (or from below when the hole is near the top)
    const above = y > 120;
    arrow.className = 'g-arrow ' + (above ? 'down' : 'up');
    arrow.style.left = (cx - 30) + 'px'; arrow.style.top = (above ? y - 78 : y + h + 12) + 'px';
    // the card stays clear of the hole
    if (cy > H * 0.45) { card.style.top = '18px'; card.style.bottom = ''; } else { card.style.top = ''; card.style.bottom = '150px'; }
  }
  return { show, get on() { return !root.hidden; } };
}
