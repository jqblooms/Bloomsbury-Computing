// Network Builder (Year 6, 6.3.1), laid out like a network simulator: devices on the left, a desk to build on,
// a tutorial panel on the right. Drag a device onto the desk, drag from a device's green socket to another device
// to plug in a cable, then test with Send. A laptop and a printer have one network socket; a switch has eight.
//   ?activity=build  missions: Join Two Laptops (tutorial), Add a Third Laptop (tutorial), Share the Printer (one check)
//   ?activity=fix    missions: Predict, then Fix (random faults, 2 clean rounds), Two Rooms (predict, then one cable)
//   no activity      the standalone app (Resources): all eleven missions, grouped, with Wi-Fi points and tablets
//                    (a tablet has no socket; it joins any Wi-Fi point whose dotted range circle it is inside).
// A one-check mission with a mistake does not count and starts again. No requestAnimationFrame (hidden iframes).
(function () {
  'use strict';
  var el = Lab.el;
  var ACTP = new URLSearchParams(location.search).get('activity');
  var ACT = ACTP === 'fix' ? 'fix' : ACTP === 'build' ? 'build' : 'all';
  var host = document.getElementById('activity');
  var log = Lab.results('netlab-' + ACT, ACT === 'fix' ? 'Network Builder: Fix the Network' : ACT === 'build' ? 'Network Builder: Build a Network' : 'Network Builder: All Missions');
  var PORTS = { laptop: 1, printer: 1, 'switch': 8, wifi: 1, tablet: 0 };
  var LABEL = { laptop: 'Laptop', printer: 'Printer', 'switch': 'Switch', wifi: 'Wi-Fi point', tablet: 'Tablet' };
  var RANGE = 150;
  var NAMES = ['Ana', 'Ben', 'Chi', 'Dev', 'Eli', 'Fai', 'Gus', 'Hana', 'Ivy', 'Jon', 'Kim', 'Lek'];
  var W = 640, H = 380, NEED = 2;

  // ------------------------------------------------------------ the network
  var S = null; // { devs, cables, names, palette, sel, refused, lastTest, rooms, startCables, startDevs, anim }
  function fresh(palette) { return { devs: [], cables: [], names: Lab.shuffle(NAMES), palette: palette || {}, sel: null, refused: false, lastTest: null, rooms: null, nextId: 1 }; }
  function dev(id) { return S.devs.filter(function (d) { return d.id === id; })[0]; }
  function cablesOf(id) { return S.cables.filter(function (c) { return c.a === id || c.b === id; }); }
  function sockets(d) { return d.ports || PORTS[d.kind]; }
  function freeSockets(d) { return sockets(d) - cablesOf(d.id).length; }
  function isClient(d) { return d.kind === 'laptop' || d.kind === 'tablet'; }
  function inRange(t, w) { return Math.hypot(t.x - w.x, t.y - w.y) <= RANGE; }
  function aps(t) { return S.devs.filter(function (w) { return w.kind === 'wifi' && inRange(t, w); }); }
  function links(x) {
    var d = dev(x), out = cablesOf(x).map(function (c) { return c.a === x ? c.b : c.a; });
    if (d.kind === 'wifi') S.devs.forEach(function (t) { if (t.kind === 'tablet' && inRange(t, d)) out.push(t.id); });
    if (d.kind === 'tablet') aps(d).forEach(function (w) { out.push(w.id); });
    return out;
  }
  function count(kind) { return S.devs.filter(function (d) { return d.kind === kind; }).length; }
  function ends() { return S.devs.filter(function (d) { return d.kind !== 'switch' && d.kind !== 'wifi'; }); }
  function place(kind, x, y, name) {
    var d = { id: S.nextId++, kind: kind, x: x, y: y };
    if (name) d.name = name;
    else if (kind === 'laptop' || kind === 'tablet') { var used = S.devs.map(function (o) { return o.name; }); d.name = S.names.filter(function (n) { return used.indexOf(n) < 0; })[0]; }
    else d.name = count(kind) ? LABEL[kind] + ' ' + (count(kind) + 1) : LABEL[kind];
    S.devs.push(d);
    return d;
  }
  function plug(a, b) { S.cables.push({ a: a.id, b: b.id }); }
  // Data travels along cables (and Wi-Fi); only a switch or a Wi-Fi point passes it on to other devices.
  function route(a, b) {
    var prev = {}, q = [a.id];
    prev[a.id] = 0;
    while (q.length) {
      var x = q.shift();
      if (x === b.id) break;
      if (x !== a.id && dev(x).kind !== 'switch' && dev(x).kind !== 'wifi') continue;
      links(x).forEach(function (y) { if (!(y in prev)) { prev[y] = x; q.push(y); } });
    }
    if (!(b.id in prev)) return null;
    var out = [b], at = b.id;
    while (at !== a.id) { at = prev[at]; out.unshift(dev(at)); }
    return out;
  }
  function verb(a, b) { return b.kind === 'printer' ? 'Print' : 'Send a message'; }
  function jobText(a, b) { return b.kind === 'printer' ? a.name + ' prints on the ' + b.name : a.name + ' sends a message to ' + b.name; }
  function why(a, b) {
    var r = route(a, b);
    if (r) return r.map(function (d) { return d.name; }).join(' &rarr; ');
    var i, both = [a, b];
    for (i = 0; i < 2; i++) {
      var d = both[i];
      if (d.kind === 'tablet' && !aps(d).length) return d.name + ' is out of Wi-Fi range.';
      if (d.kind === 'tablet' && aps(d).every(function (w) { return !cablesOf(w.id).length; })) return 'The Wi-Fi point near ' + d.name + ' is not plugged in.';
      if (d.kind !== 'tablet' && !cablesOf(d.id).length) return d.name + ' is not plugged in.';
    }
    return 'No cables join ' + a.name + ' to ' + b.name + '.';
  }
  function tryPlug(a, b) {
    if (!a || !b || a === b) return;
    if (S.cables.some(function (c) { return (c.a === a.id && c.b === b.id) || (c.a === b.id && c.b === a.id); })) { toast('These two are already joined.', 'hint'); return; }
    var tab = a.kind === 'tablet' ? a : b.kind === 'tablet' ? b : null;
    if (tab) { toast(tab.name + '\'s tablet has no network socket. It joins by Wi-Fi: put it inside a Wi-Fi point\'s dotted circle.', 'hint'); afterChange(); return; }
    var full = freeSockets(a) <= 0 ? a : freeSockets(b) <= 0 ? b : null;
    if (full) {
      S.refused = true;
      toast(full.kind === 'switch' ? full.name + ' has no free sockets.' : full.name + ' has only <b>one</b> network socket, and it is already used.', 'bad');
      afterChange(); return;
    }
    plug(a, b); toast('Cable plugged in: ' + a.name + ' to ' + b.name + '.', 'good'); afterChange();
  }

  // ------------------------------------------------------------ drawing
  function icon(d, x, y) {
    if (d.kind === 'printer') return '<rect class="paper" x="' + (x - 16) + '" y="' + (y - 30) + '" width="32" height="16" rx="2"/><rect class="body" x="' + (x - 30) + '" y="' + (y - 16) + '" width="60" height="30" rx="6"/><rect class="slot" x="' + (x - 18) + '" y="' + (y + 2) + '" width="36" height="4" rx="2"/>';
    if (d.kind === 'switch') {
      var n = d.ports || 8, s = '<rect class="body sw" x="' + (x - 46) + '" y="' + (y - 14) + '" width="92" height="28" rx="5"/>';
      for (var i = 0; i < n; i++) s += '<rect class="port" x="' + (x - n * 5 + 2 + i * 10) + '" y="' + (y - 5) + '" width="7" height="7" rx="1"/>';
      return s;
    }
    if (d.kind === 'tablet') return '<rect class="body" x="' + (x - 20) + '" y="' + (y - 30) + '" width="40" height="56" rx="6"/><rect class="screen" x="' + (x - 15) + '" y="' + (y - 24) + '" width="30" height="42" rx="2"/>';
    if (d.kind === 'wifi') return '<path class="wave" d="M' + (x - 20) + ' ' + (y - 18) + ' Q' + x + ' ' + (y - 36) + ' ' + (x + 20) + ' ' + (y - 18) + '"/><path class="wave" d="M' + (x - 11) + ' ' + (y - 12) + ' Q' + x + ' ' + (y - 22) + ' ' + (x + 11) + ' ' + (y - 12) + '"/>' +
      '<rect class="body sw" x="' + (x - 26) + '" y="' + (y - 6) + '" width="52" height="20" rx="5"/><circle class="led" cx="' + x + '" cy="' + (y + 4) + '" r="3"/>';
    return '<rect class="body" x="' + (x - 26) + '" y="' + (y - 26) + '" width="52" height="34" rx="4"/><rect class="screen" x="' + (x - 21) + '" y="' + (y - 21) + '" width="42" height="24" rx="2"/><rect class="body" x="' + (x - 34) + '" y="' + (y + 8) + '" width="68" height="7" rx="3"/>';
  }
  function sockXY(d) { return d.kind === 'switch' ? [d.x + 56, d.y] : d.kind === 'wifi' ? [d.x + 36, d.y + 4] : [d.x + 38, d.y - 4]; }
  function svgFor(state, opts) {
    var keep = S; S = state; opts = opts || {};
    var out = '<svg class="desk' + (opts.mini ? ' mini' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The network desk">';
    (state.rooms || []).forEach(function (r) { out += '<rect class="room" x="' + r.x + '" y="10" width="' + r.w + '" height="' + (H - 16) + '" rx="14"/><text class="room-t" x="' + (r.x + 14) + '" y="34">' + r.name + '</text>'; });
    state.devs.forEach(function (w) { if (w.kind === 'wifi') out += '<circle class="range" cx="' + w.x + '" cy="' + w.y + '" r="' + RANGE + '"/>'; });
    state.devs.forEach(function (t) { if (t.kind === 'tablet') aps(t).forEach(function (w) { out += '<line class="air" x1="' + t.x + '" y1="' + t.y + '" x2="' + w.x + '" y2="' + w.y + '"/>'; }); });
    state.cables.forEach(function (c, i) {
      var a = dev(c.a), b = dev(c.b), lit = opts.hl && opts.hl.indexOf(i) >= 0;
      out += '<line class="cable' + (state.sel && state.sel.cable === i ? ' sel' : '') + (lit ? ' lit' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
      if (!opts.mini) out += '<line class="hit" data-cable="' + i + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    if (opts.temp) out += '<line class="cable temp" x1="' + opts.temp[0] + '" y1="' + opts.temp[1] + '" x2="' + opts.temp[2] + '" y2="' + opts.temp[3] + '"/>';
    state.devs.forEach(function (d) {
      var sel = state.sel && state.sel.dev === d.id;
      out += '<g class="dev ' + d.kind + (sel ? ' sel' : '') + (opts.dim && opts.dim.indexOf(d.id) >= 0 ? ' dim' : '') + '" data-dev="' + d.id + '"><rect class="pad" x="' + (d.x - 50) + '" y="' + (d.y - 36) + '" width="100" height="84" rx="10"/>' + icon(d, d.x, d.y) +
        '<text x="' + d.x + '" y="' + (d.y + 40) + '">' + d.name + '</text>';
      if (!opts.mini && sockets(d) > 0) { var s = sockXY(d); out += '<circle class="sock' + (freeSockets(d) > 0 ? '' : ' full') + '" data-sock="' + d.id + '" cx="' + s[0] + '" cy="' + s[1] + '" r="8"/>'; }
      out += '</g>';
    });
    if (state.anim) out += '<g class="packet" transform="translate(' + state.anim.x + ' ' + state.anim.y + ')"><rect x="-13" y="-9" width="26" height="18" rx="3"/><path d="M-13 -9 L0 2 L13 -9"/></g>';
    out += '</svg>';
    S = keep;
    return out;
  }

  // ------------------------------------------------------------ layout
  var M = null, missionAt = 0, done = Lab.load(ACT + ':done', {}), have = 0, ui = {};
  function shell() {
    host.innerHTML = '';
    if (ACT === 'all') host.appendChild(el('h1', { class: 'lab-title' }, 'Network Builder'));
    var wrap = el('div', { class: 'nb' });
    ui.pal = el('div', { class: 'nb-pal', 'aria-label': 'Devices' });
    ui.stage = el('div', { class: 'nb-stage' });
    ui.desk = el('div', { class: 'nb-desk' });
    ui.tools = el('div', { class: 'nb-tools' });
    ui.toast = el('div', { class: 'feedback', role: 'status' });
    ui.test = el('div', { class: 'nb-test' });
    ui.stage.appendChild(ui.desk); ui.stage.appendChild(ui.tools); ui.stage.appendChild(ui.test); ui.stage.appendChild(ui.toast);
    ui.tut = el('aside', { class: 'nb-tut', 'aria-label': 'Tutorial' });
    wrap.appendChild(ui.pal); wrap.appendChild(ui.stage); wrap.appendChild(ui.tut);
    host.appendChild(wrap);
    ui.desk.addEventListener('pointerdown', deskDown);
    ui.desk.addEventListener('pointermove', deskMove);
    ui.desk.addEventListener('pointerup', deskUp);
    ui.desk.addEventListener('pointercancel', function () { drag = null; drawDesk(); });
  }
  function toast(msg, cls) { ui.toast.className = 'feedback ' + (cls || ''); ui.toast.innerHTML = msg || ''; }
  function locked() { return M.phase === 'predict' || M.phase === 'checked'; }
  function drawDesk(temp) {
    ui.desk.innerHTML = svgFor(S, { temp: temp, hl: S.hlCables });
    ui.desk.classList.toggle('locked', locked());
    ui.desk.classList.toggle('pulse-sock', M.show === 'sock');
    ui.desk.classList.toggle('pulse-cable', M.show === 'cable');
  }
  function drawPalette() {
    ui.pal.innerHTML = '<div class="nb-h">Devices</div>';
    ['laptop', 'tablet', 'printer', 'switch', 'wifi'].forEach(function (k) {
      if (!(k in S.palette)) return;
      var left = S.palette[k] - count(k);
      var b = el('button', { type: 'button', class: 'pal-item' + (M.show === 'pal-' + k ? ' pulse' : ''), 'data-kind': k, 'aria-label': 'Add a ' + LABEL[k] },
        '<svg viewBox="-50 -40 100 70" aria-hidden="true">' + icon({ kind: k }, 0, 0) + '</svg><span>' + LABEL[k] + '</span><small>' + left + ' left</small>');
      b.disabled = left <= 0 || locked();
      b.addEventListener('pointerdown', palDown);
      ui.pal.appendChild(b);
    });
    var any = Object.keys(S.palette).length > 0;
    if (!any) ui.pal.innerHTML = '<div class="nb-h">Cables</div>';
    ui.pal.appendChild(el('p', { class: 'small' }, (any ? 'Drag a device onto the desk. ' : '') + 'Drag from a green socket to another device to plug in a cable. To take a cable out, click it, then press Delete selected.'));
  }
  function drawTools() {
    ui.tools.innerHTML = '';
    var del = Lab.button('Delete selected', 'secondary', removeSel);
    del.disabled = !S.sel || locked();
    ui.tools.appendChild(del);
    ui.tools.appendChild(el('span', { class: 'small' }, S.sel ? (S.sel.cable != null ? 'Cable selected.' : dev(S.sel.dev).name + ' selected.') + ' Press Delete to remove it.' : 'Click a device or a cable to select it.'));
  }
  function drawTest() {
    ui.test.innerHTML = '';
    ui.test.classList.toggle('pulse', M.show === 'test');
    var list = ends();
    if (list.length < 2) { ui.test.appendChild(el('span', { class: 'small' }, 'Test: add two devices, then send a message between them.')); return; }
    var from = el('select', { id: 'nb-from', 'aria-label': 'From' }), to = el('select', { id: 'nb-to', 'aria-label': 'To' });
    list.forEach(function (d) { if (isClient(d)) from.appendChild(el('option', { value: d.id }, d.name)); to.appendChild(el('option', { value: d.id }, d.name)); });
    if (ui.from && list.some(function (d) { return String(d.id) === ui.from && isClient(d); })) from.value = ui.from;
    if (ui.to && list.some(function (d) { return String(d.id) === ui.to; })) to.value = ui.to;
    else if (to.options.length > 1 && to.value === from.value) to.selectedIndex = 1;
    var go = Lab.button('', '', function () { send(dev(Number(from.value)), dev(Number(to.value))); });
    function label() { var b = dev(Number(to.value)); go.textContent = b && b.kind === 'printer' ? 'Print' : 'Send'; }
    from.addEventListener('change', function () { ui.from = from.value; });
    to.addEventListener('change', function () { ui.to = to.value; label(); });
    label();
    go.disabled = !!S.anim || M.phase === 'predict';
    ui.test.appendChild(el('b', {}, 'Test'));
    ui.test.appendChild(el('span', {}, 'From')); ui.test.appendChild(from);
    ui.test.appendChild(el('span', {}, 'to')); ui.test.appendChild(to);
    ui.test.appendChild(go);
  }
  function drawAll() { drawPalette(); drawDesk(); drawTools(); drawTest(); drawTut(); Lab.reportHeight(); }

  // ------------------------------------------------------------ sending, with the packet moving along the route
  function send(a, b) {
    if (!a || !b || S.anim) return;
    if (a === b) { toast('Choose two different devices.', 'hint'); return; }
    var r = route(a, b);
    if (!r) { S.lastTest = { a: a.id, b: b.id, ok: false }; toast('It did not get there. ' + why(a, b), 'bad'); afterChange(); return; }
    var pts = r.map(function (d) { return [d.x, d.y]; }), seg = 0, t = 0;
    S.hlCables = [];
    for (var i = 0; i + 1 < r.length; i++) S.cables.forEach(function (c, k) { if ((c.a === r[i].id && c.b === r[i + 1].id) || (c.b === r[i].id && c.a === r[i + 1].id)) S.hlCables.push(k); });
    S.anim = { x: pts[0][0], y: pts[0][1] };
    drawTest();
    (function tick() {
      t += 0.1;
      if (t >= 1) { t = 0; seg++; }
      if (seg >= pts.length - 1) {
        S.anim = null; S.hlCables = null;
        S.lastTest = { a: a.id, b: b.id, ok: true };
        toast((b.kind === 'printer' ? 'Printed! ' : 'Message arrived! ') + why(a, b), 'good');
        afterChange(); return;
      }
      S.anim = { x: pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * t, y: pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * t };
      drawDesk();
      setTimeout(tick, 35);
    })();
  }

  // ------------------------------------------------------------ dragging
  var drag = null;
  function pt(e) {
    var svg = ui.desk.querySelector('svg'), p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    var q = p.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.max(50, Math.min(W - 50, q.x)), Math.max(40, Math.min(H - 64, q.y))];
  }
  function near(p, skip) {
    var best = null, bd = 60;
    S.devs.forEach(function (d) { var dd = Math.hypot(d.x - p[0], d.y - p[1]); if (d.id !== skip && dd < bd) { bd = dd; best = d; } });
    return best;
  }
  function deskDown(e) {
    if (locked() || S.anim) return;
    var sock = e.target.closest('[data-sock]'), g = e.target.closest('[data-dev]'), c = e.target.closest('[data-cable]'), p = pt(e);
    if (sock) { var d = dev(Number(sock.getAttribute('data-sock'))); drag = { type: 'cable', from: d, start: sockXY(d) }; }
    else if (g) { var d2 = dev(Number(g.getAttribute('data-dev'))); drag = { type: 'move', d: d2, dx: d2.x - p[0], dy: d2.y - p[1], moved: false }; }
    else if (c) { S.sel = { cable: Number(c.getAttribute('data-cable')) }; drawAll(); return; }
    else { S.sel = null; drawAll(); return; }
    try { ui.desk.setPointerCapture(e.pointerId); } catch (x) {}
    e.preventDefault();
  }
  function deskMove(e) {
    if (!drag) return;
    var p = pt(e);
    if (drag.type === 'move') {
      if (!drag.moved && Math.hypot(drag.d.x - drag.dx - p[0], drag.d.y - drag.dy - p[1]) < 4) return;
      drag.moved = true; drag.d.x = p[0] + drag.dx; drag.d.y = p[1] + drag.dy; drawDesk();
    } else drawDesk([drag.start[0], drag.start[1], p[0], p[1]]);
  }
  function deskUp(e) {
    if (!drag) return;
    var d = drag, p = pt(e);
    drag = null;
    if (d.type === 'move') { if (!d.moved) S.sel = { dev: d.d.id }; drawAll(); return; }
    var target = near(p, d.from.id);
    if (target) tryPlug(d.from, target);
    else { toast('Let go on top of another device to plug the cable in.', 'hint'); drawAll(); }
  }
  function palDown(e) {
    var kind = this.getAttribute('data-kind');
    if (this.disabled) return;
    e.preventDefault();
    var ghost = el('div', { class: 'ghost' }, '<svg viewBox="-50 -40 100 70">' + icon({ kind: kind }, 0, 0) + '</svg>'), x0 = e.clientX, y0 = e.clientY, moved = false;
    document.body.appendChild(ghost);
    function at(ev) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
    at(e);
    function mv(ev) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) moved = true; at(ev); }
    function up(ev) {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      ghost.remove();
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) moved = true;
      var r = ui.desk.getBoundingClientRect();
      if (moved && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) add(kind, pt(ev));
      else if (!moved) add(kind, spot());
    }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  }
  function spot() {
    var tries = [[110, 80], [320, 80], [530, 80], [110, 290], [320, 290], [530, 290], [215, 185], [425, 185]];
    return tries.filter(function (p) { return !near(p); })[0] || [320, 185];
  }
  function add(kind, p) {
    if (S.palette[kind] - count(kind) <= 0) return;
    var d = place(kind, p[0], p[1]);
    toast(d.name + ' is on the desk.', 'good');
    afterChange();
  }
  function removeSel() {
    if (!S.sel || locked()) return;
    if (S.sel.cable != null) { S.cables.splice(S.sel.cable, 1); toast('Cable taken out.', 'good'); }
    else { var id = S.sel.dev; S.cables = S.cables.filter(function (c) { return c.a !== id && c.b !== id; }); S.devs = S.devs.filter(function (d) { return d.id !== id; }); toast('Device taken off the desk.', 'good'); }
    S.sel = null; afterChange();
  }
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && S && S.sel && !/select|input/i.test(e.target.tagName)) { e.preventDefault(); removeSel(); }
  });

  // ------------------------------------------------------------ missions
  function laptops() { return S.devs.filter(function (d) { return d.kind === 'laptop'; }); }
  function plugged(a, kind) { return cablesOf(a.id).some(function (c) { return dev(c.a === a.id ? c.b : c.a).kind === kind; }); }
  function allPairs() {
    var e = ends(), out = [];
    e.forEach(function (a) { e.forEach(function (b) { if (a !== b && isClient(a) && (b.kind === 'printer' || (isClient(b) && a.id < b.id))) out.push([a, b]); }); });
    return out;
  }
  var BUILD = [
    { id: 'two', group: 'Getting started', title: 'Join Two Laptops', type: 'tutorial', setup: function () { S = fresh({ laptop: 2 }); },
      intro: 'Two laptops on their own cannot share anything. Join them to make a network.',
      steps: [
        { text: 'Drag a <b>Laptop</b> from the left onto the desk.', show: 'pal-laptop', done: function () { return count('laptop') >= 1; } },
        { text: 'Drag a second <b>Laptop</b> onto the desk.', show: 'pal-laptop', done: function () { return count('laptop') >= 2; } },
        { text: 'Plug in a cable: press on the <b>green socket</b> next to one laptop, drag to the other laptop, and let go.', show: 'sock', done: function () { return S.cables.length >= 1; } },
        { text: 'Test it. Under the desk, choose who sends and who gets it, then press <b>Send</b>.', show: 'test', done: function () { return S.lastTest && S.lastTest.ok; } }
      ], end: 'Two devices joined so they can share data: that is a <b>network</b>.' },
    { id: 'switch', group: 'Getting started', title: 'Add a Third Laptop', type: 'tutorial', setup: function () {
      S = fresh({ laptop: 3, 'switch': 1 }); var a = place('laptop', 150, 100), b = place('laptop', 490, 100); plug(a, b); },
      intro: 'A third person wants to join the network.',
      steps: [
        { text: 'Drag a third <b>Laptop</b> onto the desk.', show: 'pal-laptop', done: function () { return count('laptop') >= 3; } },
        { text: 'Try to plug the new laptop into one of the other two. Watch what happens.', show: 'sock', done: function () { return S.refused; } },
        { text: 'Each laptop has only one network socket. Drag a <b>Switch</b> onto the desk: it has eight sockets.', show: 'pal-switch', done: function () { return count('switch') >= 1; } },
        { text: 'Take out the old cable: click the cable between the first two laptops, then press <b>Delete selected</b>.', show: 'cable', done: function () { return !S.cables.some(function (c) { return dev(c.a).kind === 'laptop' && dev(c.b).kind === 'laptop'; }); } },
        { text: 'Plug <b>all three</b> laptops into the switch: drag from each laptop\'s socket to the switch.', show: 'sock', done: function () { return laptops().length >= 3 && laptops().every(function (l) { return plugged(l, 'switch'); }); } },
        { text: 'Test it: send a message between two laptops. Watch it go through the switch.', show: 'test', done: function () { return S.lastTest && S.lastTest.ok; } }
      ], end: 'A <b>switch</b> joins many devices. Data goes from one laptop, through the switch, to another.' },
    { id: 'printer', group: 'Getting started', title: 'Share the Printer', type: 'challenge', setup: function () { S = fresh({ laptop: 4, printer: 1, 'switch': 1 }); },
      intro: 'Build a network for a class: <b>four laptops</b> and <b>one printer</b>.',
      goals: ['Every laptop can print on the Printer.', 'Every laptop can send a message to every other laptop.', 'Test it with Send and Print before you check.'],
      check: function () {
        var probs = [];
        if (count('laptop') < 4) probs.push('There should be four laptops.');
        if (count('printer') < 1) probs.push('There is no printer.');
        allPairs().forEach(function (p) { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); });
        return probs;
      } }
  ];
  // Predict, then Fix: a switch network with one fault.
  function faulty() {
    for (;;) {
      S = fresh({});
      var sw = place('switch', 320, 190, 'Switch'), spots = Lab.shuffle([[110, 80], [320, 64], [530, 80], [110, 290], [530, 290]]);
      var pr = place('printer', spots[0][0], spots[0][1]), ls = [1, 2, 3].map(function (i) { return place('laptop', spots[i][0], spots[i][1]); });
      var all = [pr].concat(ls), fault = Lab.pick(['unplug', 'unplug', 'pair', 'printer']);
      if (fault === 'pair') { plug(ls[0], ls[1]); plug(ls[2], sw); plug(pr, sw); }
      else if (fault === 'printer') ls.forEach(function (l) { plug(l, sw); });
      else all.forEach(function (d) { if (d !== ls[0]) plug(d, sw); });
      var jobs = Lab.shuffle(allPairs()).slice(0, 3);
      var yes = jobs.filter(function (p) { return route(p[0], p[1]); }).length;
      if (yes >= 1 && yes <= 2) { S.jobs = jobs; S.startDevs = S.devs.length; return; }
    }
  }
  function rooms() {
    S = fresh({});
    S.rooms = [{ x: 14, w: 300, name: 'Room 1' }, { x: 326, w: 300, name: 'Room 2' }];
    var a = place('switch', 164, 195, 'Switch 1'), b = place('switch', 476, 195, 'Switch 2');
    var a1 = place('laptop', 84, 96), a2 = place('laptop', 244, 96), a3 = place('laptop', 164, 296);
    var b1 = place('laptop', 396, 96), b2 = place('laptop', 556, 96), pr = place('printer', 476, 296, 'Printer');
    [a1, a2, a3].forEach(function (l) { plug(l, a); });
    [b1, b2, pr].forEach(function (l) { plug(l, b); });
    S.jobs = Lab.shuffle([[a1, pr], [b1, pr], [a2, a3], [a2, b2]]).slice(0, 3);
    S.startDevs = S.devs.length; S.startCables = S.cables.length;
  }
  var FIX = [
    { id: 'predict', group: 'Troubleshooting', title: 'Predict, then Fix', type: 'fix', rounds: NEED, setup: faulty,
      intro: 'Something is wrong with this network. First predict which jobs work, then fix it.',
      check: function () {
        var probs = [];
        if (S.devs.length < S.startDevs) probs.push('A device was taken off the desk. Fix the cables, keep the devices.');
        allPairs().forEach(function (p) { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); });
        return probs;
      } },
    { id: 'rooms', group: 'Bigger networks', title: 'Two Rooms', type: 'fix', rounds: 1, setup: rooms,
      intro: 'Two classrooms each have a network. Only Room 2 has a printer.',
      fixText: 'Fix it so <b>every laptop in both rooms</b> can print, using <b>one</b> new cable. Test it, then check.',
      check: function () {
        var probs = [];
        if (S.devs.length < S.startDevs) probs.push('A device was taken off the desk.');
        laptops().forEach(function (l) { var p = S.devs.filter(function (d) { return d.kind === 'printer'; })[0]; if (!route(l, p)) probs.push(jobText(l, p) + ': ' + why(l, p)); });
        if (!probs.length && S.cables.length > S.startCables + 1) probs.push('Every laptop can print, but you used ' + (S.cables.length - S.startCables) + ' new cables. One cable is enough.');
        return probs;
      } }
  ];
  function everyone(extra) {
    var probs = extra || [];
    allPairs().forEach(function (p) { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); });
    return probs;
  }
  function kept(probs) { if (S.devs.length < S.startDevs) probs.unshift('A device was taken off the desk. Keep every device.'); return probs; }
  function routeText(r) { return r.map(function (d) { return d.name; }).join(' &rarr; '); }
  var WIFI1 = { id: 'wifi', group: 'Wi-Fi', title: 'Join with Wi-Fi', type: 'tutorial',
    setup: function () { S = fresh({ wifi: 1, tablet: 1 }); var sw = place('switch', 170, 190, 'Switch'), l = place('laptop', 80, 70), p = place('printer', 80, 290); plug(l, sw); plug(p, sw); },
    intro: 'A tablet has no network socket. It joins the network with Wi-Fi.',
    steps: [
      { text: 'Drag a <b>Wi-Fi point</b> onto the right-hand side of the desk.', show: 'pal-wifi', done: function () { return count('wifi') >= 1; } },
      { text: 'Plug the Wi-Fi point into the switch: drag from its green socket to the switch.', show: 'sock', done: function () { return S.devs.some(function (w) { return w.kind === 'wifi' && plugged(w, 'switch'); }); } },
      { text: 'Drag a <b>Tablet</b> onto the desk, <b>inside</b> the dotted circle. A dotted line shows it has joined the Wi-Fi.', show: 'pal-tablet', done: function () { return S.devs.some(function (t) { return t.kind === 'tablet' && aps(t).length; }); } },
      { text: 'Test it: print from the tablet.', show: 'test', done: function () { return S.lastTest && S.lastTest.ok && dev(S.lastTest.a).kind === 'tablet' && dev(S.lastTest.b).kind === 'printer'; } },
      { text: 'Drag the tablet <b>outside</b> the dotted circle, then try to print again.', show: 'test', done: function () { return S.lastTest && !S.lastTest.ok && dev(S.lastTest.a).kind === 'tablet'; } }
    ], end: 'Wi-Fi joins devices with no cable, but only inside its <b>range</b>. The Wi-Fi point itself still needs a cable to the switch.' };
  var WIFI2 = { id: 'range', group: 'Wi-Fi', title: 'Out of Range', type: 'challenge',
    setup: function () {
      S = fresh({ wifi: 2 }); var sw = place('switch', 320, 190, 'Switch'), w = place('wifi', 120, 110, 'Wi-Fi point'), l = place('laptop', 320, 64), p = place('printer', 320, 290);
      plug(w, sw); plug(l, sw); plug(p, sw); place('tablet', 560, 80); place('tablet', 560, 280); S.startDevs = S.devs.length; },
    intro: 'Two tablets cannot reach anything.',
    goals: ['Both tablets can print.', 'Both tablets can send a message to the laptop.', 'Move devices, or add a Wi-Fi point. Test, then check.'],
    check: function () { return kept(everyone()); },
    walk: function () {
      S = fresh({}); var sw = place('switch', 320, 200, 'Switch'), w = place('wifi', 150, 110, 'Wi-Fi point'), p = place('printer', 320, 300), t = place('tablet', 520, 250), ex = S, st = [];
      plug(w, sw); plug(p, sw);
      st.push({ text: '<b>A similar network.</b> Can ' + t.name + ' print?', visual: mini(ex) });
      st.push({ text: 'The dotted circle is the Wi-Fi range. ' + t.name + ' is outside it, so it is <span class="hl">out of range</span>: No.', visual: mini(ex) });
      t.x = 250; t.y = 200;
      st.push({ text: 'Drag the tablet inside the circle (or move the Wi-Fi point nearer). The dotted line shows it has joined.', visual: mini(ex) });
      st.push({ text: 'Test: ' + routeText(route(t, p)) + '.', visual: mini(ex) });
      st.push({ text: 'A second Wi-Fi point, plugged into the switch, gives a second circle. Now fix yours, test, then check.', visual: '' });
      return st;
    } };
  var FULL = { id: 'full', group: 'Bigger networks', title: 'The Switch Is Full', type: 'challenge',
    setup: function () {
      S = fresh({ laptop: 5, 'switch': 2 }); var sw = place('switch', 320, 190, 'Switch'); sw.ports = 4;
      [[110, 70], [320, 64], [530, 70]].forEach(function (q) { plug(place('laptop', q[0], q[1]), sw); });
      plug(place('printer', 110, 290), sw); S.startDevs = S.devs.length; },
    intro: 'This switch has only <b>4</b> sockets, and they are all used.',
    goals: ['Add <b>two more</b> laptops.', 'Every laptop can print.', 'Every laptop can send a message to every other laptop.'],
    check: function () { return kept(everyone(count('laptop') < 5 ? ['There should be five laptops.'] : [])); },
    walk: function () {
      S = fresh({}); var a = place('switch', 220, 190, 'Switch'), st = [], ex; a.ports = 4;
      var ds = [[90, 70], [220, 64], [350, 70]].map(function (q) { var l = place('laptop', q[0], q[1]); plug(l, a); return l; });
      var p = place('printer', 90, 290); plug(p, a); ex = S;
      st.push({ text: '<b>A similar network.</b> All 4 sockets on the switch are used. One more laptop needs to join.', visual: mini(ex) });
      var b = place('switch', 470, 190, 'Switch 2');
      st.push({ text: 'You cannot plug into a full switch. Add a <b>second switch</b>.', visual: mini(ex) });
      S.cables = S.cables.filter(function (c) { return c.a !== ds[2].id && c.b !== ds[2].id; }); plug(ds[2], b); plug(a, b);
      st.push({ text: 'Move ' + ds[2].name + '\'s cable to Switch 2. That frees a socket on Switch 1: use it for a cable between the two switches.', visual: mini(ex) });
      var n = place('laptop', 560, 300); plug(n, b);
      st.push({ text: 'Plug the new laptop into Switch 2. Test: ' + routeText(route(n, p)) + '.', visual: mini(ex, cablesOn(ex, route(n, p))) });
      st.push({ text: 'Data can pass through two switches. Now do yours: test every laptop, then check.', visual: '' });
      return st;
    } };
  function faultyWifi() {
    for (;;) {
      S = fresh({});
      var sw = place('switch', 320, 200, 'Switch'), w = place('wifi', 150, 110, 'Wi-Fi point'), l = place('laptop', 530, 70), p = place('printer', 530, 290);
      var t1 = place('tablet', 90, 230), t2 = place('tablet', 240, 64), fault = Lab.pick(['range', 'unplug', 'printer']);
      plug(l, sw);
      if (fault !== 'printer') plug(p, sw);
      if (fault !== 'unplug') plug(w, sw);
      if (fault === 'range') { t2.x = 400; t2.y = 290; }
      var jobs = Lab.shuffle(allPairs()).slice(0, 3);
      var yes = jobs.filter(function (q) { return route(q[0], q[1]); }).length;
      if (yes >= 1 && yes <= 2) { S.jobs = jobs; S.startDevs = S.devs.length; return; }
    }
  }
  var FIXW = { id: 'fixw', group: 'Troubleshooting', title: 'Predict, then Fix: Wi-Fi', type: 'fix', rounds: NEED, setup: faultyWifi,
    intro: 'Something is wrong with this Wi-Fi network. First predict, then fix it.',
    fixText: 'Fix it so <b>every</b> laptop and tablet can print and message each other. You can move devices and plug in cables. Test it, then check.',
    check: function () { return kept(everyone()); } };
  var BUDGET = { id: 'budget', group: 'Design', title: 'Cable Budget', type: 'challenge', maxNew: 5,
    setup: function () { S = fresh({ laptop: 3, tablet: 2, printer: 1, 'switch': 1, wifi: 1 }); S.startCables = 0; },
    intro: 'Build a network for <b>three laptops, two tablets and a printer</b>. Cables cost money.',
    goals: ['Everyone can print.', 'Everyone can send a message to everyone.', 'Use <b>5 cables or fewer</b>.'],
    check: function () {
      var probs = [];
      if (count('laptop') < 3 || count('tablet') < 2 || count('printer') < 1) probs.push('Put all three laptops, both tablets and the printer on the desk.');
      everyone(probs);
      if (!probs.length && S.cables.length > 5) probs.push('Everyone is joined, but you used ' + S.cables.length + ' cables. 5 is enough.');
      return probs;
    },
    walk: function () {
      S = fresh({}); var sw = place('switch', 320, 190, 'Switch'), a = place('laptop', 110, 70), b = place('laptop', 530, 70), p = place('printer', 110, 290), w = place('wifi', 470, 280, 'Wi-Fi point'), t = place('tablet', 560, 190), ex = S, st = [];
      st.push({ text: '<b>A similar network.</b> Two laptops, a printer and a tablet. What is the fewest cables?', visual: mini(ex) });
      st.push({ text: 'Every device with a socket needs <b>one</b> cable, to the switch: ' + a.name + ', ' + b.name + ', the Printer and the Wi-Fi point.', visual: mini(ex) });
      [a, b, p, w].forEach(function (d) { plug(d, sw); });
      st.push({ text: 'The tablet needs no cable. It joins by Wi-Fi, inside the dotted circle.', visual: mini(ex) });
      st.push({ text: 'That is <span class="hl">4 cables</span>. A cable between two devices that can already reach each other is a spare. Now count yours.', visual: '' });
      return st;
    } };
  var SCHOOL = { id: 'school', group: 'Design', title: 'The School Network', type: 'challenge', maxNew: 2,
    setup: function () {
      S = fresh({}); S.rooms = [{ x: 10, w: 200, name: 'Room 1' }, { x: 220, w: 200, name: 'Room 2' }, { x: 430, w: 200, name: 'Library' }];
      var s1 = place('switch', 110, 190, 'Switch 1'), s2 = place('switch', 320, 190, 'Switch 2');
      [[62, 80], [158, 80], [110, 290]].forEach(function (q) { plug(place('laptop', q[0], q[1]), s1); });
      [[272, 80], [368, 80]].forEach(function (q) { plug(place('laptop', q[0], q[1]), s2); });
      plug(place('printer', 320, 290), s2);
      place('wifi', 530, 190, 'Wi-Fi point');
      [[482, 80], [578, 80], [530, 290]].forEach(function (q) { place('tablet', q[0], q[1]); });
      S.startDevs = S.devs.length; S.startCables = S.cables.length; },
    intro: 'Three rooms, three separate networks. Only Room 2 has a printer.',
    goals: ['Every laptop and every tablet can print.', 'Everyone can send a message to everyone.', 'Use <b>2 new cables</b> or fewer.'],
    check: function () {
      var probs = kept(everyone());
      if (!probs.length && S.cables.length - S.startCables > 2) probs.push('It works, but you used ' + (S.cables.length - S.startCables) + ' new cables. 2 is enough.');
      return probs;
    },
    walk: function () {
      S = fresh({}); S.rooms = [{ x: 14, w: 300, name: 'Room A' }, { x: 326, w: 300, name: 'Library' }];
      var s = place('switch', 164, 190, 'Switch'), l = place('laptop', 84, 80), p = place('printer', 244, 290), w = place('wifi', 476, 190, 'Wi-Fi point'), t = place('tablet', 556, 90), ex = S, st = [];
      plug(l, s); plug(p, s);
      st.push({ text: '<b>A similar school.</b> Can ' + t.name + ' print?', visual: mini(ex) });
      st.push({ text: t.name + ' is inside the Wi-Fi range, but the Wi-Fi point is not plugged in. So <span class="hl">No</span>.', visual: mini(ex) });
      plug(w, s);
      st.push({ text: 'One cable from the Wi-Fi point to the switch joins the Library to Room A.', visual: mini(ex) });
      st.push({ text: 'Test: ' + routeText(route(t, p)) + '.', visual: mini(ex, cablesOn(ex, route(t, p))) });
      st.push({ text: 'Separate networks join with one cable between them: switch to switch, or Wi-Fi point to switch. Now plan yours.', visual: '' });
      return st;
    } };
  var ALL = [BUILD[0], BUILD[1], BUILD[2], WIFI1, WIFI2, FIX[1], FULL, FIX[0], FIXW, BUDGET, SCHOOL];
  var LIST = ACT === 'fix' ? FIX : ACT === 'build' ? BUILD : ALL;


  function start(i) {
    missionAt = i;
    var m = LIST[i];
    M = { m: m, step: 0, phase: m.type === 'fix' ? 'predict' : 'build', picks: {}, show: null, walked: false };
    m.setup();
    toast('');
    updateShow();
    drawAll();
  }
  function updateShow() {
    var st = M.m.steps && M.m.steps[M.step];
    M.show = M.phase === 'build' && st ? st.show : null;
  }
  function afterChange() {
    if (M.m.type === 'tutorial' && M.phase === 'build') {
      var before = M.step;
      while (M.m.steps[M.step] && M.m.steps[M.step].done()) { M.step++; S.lastTest = null; S.refused = false; }
      if (M.step >= M.m.steps.length) finishMission();
      else if (M.step !== before) updateShow();
    }
    drawAll();
  }
  function finishMission() {
    M.phase = 'done'; M.show = null;
    if (!done[missionAt]) { done[missionAt] = true; Lab.save(ACT + ':done', done); }
    log.note('Mission ' + (missionAt + 1) + ' (' + M.m.title + ') complete' + (M.walked ? ', used Walk me through it' : '') + '.');
    if (LIST.every(function (x, i) { return done[i]; })) log.finish();
  }
  function checkMission() {
    var probs = M.m.check();
    M.phase = 'checked'; M.probs = probs;
    log.add(M.m.title + ': ' + (probs.length ? probs.length + ' problem' + (probs.length > 1 ? 's' : '') : 'everything works'), !probs.length);
    if (!probs.length) {
      have++;
      if (have >= (M.m.rounds || 1)) { have = 0; finishMission(); toast('Everything works, with no mistakes.', 'good'); }
      else toast('Everything works, with no mistakes. ' + have + ' of ' + M.m.rounds + ' clean networks.', 'good');
    } else { have = 0; toast('Not this time: this network does not count.', 'bad'); }
    drawAll();
  }
  function checkPredict() {
    if (S.jobs.some(function (p, i) { return !M.picks[i]; })) { toast('Choose Yes or No for every job first.', 'hint'); return; }
    var wrong = S.jobs.filter(function (p, i) { return (M.picks[i] === 'Yes') !== !!route(p[0], p[1]); }).length;
    M.predicted = true; M.predictWrong = wrong;
    log.add(M.m.title + ' predictions: ' + (wrong ? wrong + ' wrong' : 'all right'), !wrong);
    if (wrong) { have = 0; M.phase = 'checked'; M.probs = null; toast('Not this time: this network does not count. Read why for each red job.', 'bad'); }
    else { M.phase = 'build'; toast('All three predictions right. Now fix it.', 'good'); }
    drawAll();
  }

  // ------------------------------------------------------------ the tutorial panel
  function drawTut() {
    var t = ui.tut, m = M.m;
    t.innerHTML = '';
    var tabs = el('div', { class: 'nb-tabs', role: 'group', 'aria-label': 'Missions' });
    LIST.forEach(function (x, i) {
      var open = i === 0 || done[i - 1] || done[i];
      var b = el('button', { type: 'button', 'aria-pressed': String(i === missionAt), title: x.title }, (done[i] ? '&#10003; ' : '') + (i + 1));
      b.disabled = !open;
      b.addEventListener('click', function () { have = 0; start(i); });
      tabs.appendChild(b);
    });
    t.appendChild(tabs);
    if (m.group && ACT === 'all') t.appendChild(el('div', { class: 'nb-h' }, m.group));
    t.appendChild(el('h2', {}, 'Mission ' + (missionAt + 1) + ': ' + m.title));
    if (done[missionAt] && M.phase !== 'done') t.appendChild(el('div', { class: 'done-banner small-banner' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', { class: 'small' }, m.intro));
    if (m.type === 'tutorial') {
      var ol = el('ol', { class: 'nb-steps' });
      m.steps.forEach(function (s, i) {
        var cls = i < M.step || M.phase === 'done' ? 'done' : i === M.step ? 'now' : 'later';
        var li = el('li', { class: cls }, '<span>' + s.text + '</span>');
        ol.appendChild(li);
      });
      t.appendChild(ol);
    } else if (m.type === 'challenge') {
      t.appendChild(el('ul', { class: 'nb-goals' }, m.goals.map(function (g) { return '<li>' + g + '</li>'; }).join('')));
      if (m.maxNew != null) t.appendChild(el('p', { class: 'small' }, '<b>New cables used: ' + (S.cables.length - (S.startCables || 0)) + '</b> (at most ' + m.maxNew + ').'));
      t.appendChild(el('p', { class: 'small' }, 'One check only. A mistake means this build does not count.'));
    } else {
      t.appendChild(el('p', { class: 'nb-phase' }, M.phase === 'predict' ? '<b>1. Predict.</b> Look at the cables. Will each job work? You cannot change the network yet.' : M.phase === 'build' ? '<b>2. Fix it.</b> ' + (m.fixText || 'Fix the cables so <b>every</b> laptop can print and message every other laptop. Test it, then check.') : ''));
      if (M.phase === 'predict' || M.predicted) {
        var list = el('div', { class: 'cards' });
        S.jobs.forEach(function (p, i) {
          var card = el('div', { class: 'card' }, '<span>' + jobText(p[0], p[1]) + '</span>');
          var seg = el('div', { class: 'seg', role: 'group', 'aria-label': jobText(p[0], p[1]) });
          ['Yes', 'No'].forEach(function (v) {
            var b = el('button', { type: 'button', 'aria-pressed': String(M.picks[i] === v) }, v);
            b.disabled = M.phase !== 'predict';
            b.addEventListener('click', function () { M.picks[i] = v; drawTut(); });
            seg.appendChild(b);
          });
          card.appendChild(seg);
          if (M.predicted && M.predAns) {
            var right = (M.picks[i] === 'Yes') === M.predAns[i];
            card.className = 'card ' + (right ? 'good' : 'bad');
            card.appendChild(el('span', { class: 'why' }, (M.predAns[i] ? 'Yes: ' : 'No: ') + M.predWhy[i]));
          }
          list.appendChild(card);
        });
        t.appendChild(list);
      }
    }
    if (M.phase === 'checked' && M.probs && M.probs.length) t.appendChild(el('ul', { class: 'nb-probs' }, M.probs.slice(0, 5).map(function (p) { return '<li>' + p + '</li>'; }).join('')));
    if (M.phase === 'done') t.appendChild(el('div', { class: 'done-banner' }, 'Mission complete! ' + (m.end || '')));
    var act = el('div', { class: 'actions' });
    if (M.phase === 'done') { if (missionAt < LIST.length - 1) act.appendChild(Lab.button('Next mission', '', function () { start(missionAt + 1); })); else act.appendChild(Lab.button('Play again', '', function () { start(missionAt); })); }
    else if (M.phase === 'checked') act.appendChild(Lab.button(m.type === 'fix' ? 'New network' : 'Try again', '', function () { start(missionAt); }));
    else if (M.phase === 'predict') act.appendChild(Lab.button('Check my predictions', '', function () { M.predAns = S.jobs.map(function (p) { return !!route(p[0], p[1]); }); M.predWhy = S.jobs.map(function (p) { return why(p[0], p[1]); }); checkPredict(); }));
    else if (m.type !== 'tutorial') act.appendChild(Lab.button('Check my network', '', checkMission));
    if (m.type === 'tutorial' && M.phase === 'build') act.appendChild(Lab.button('Start again', 'secondary', function () { start(missionAt); }));
    act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    t.appendChild(act);
  }

  // ------------------------------------------------------------ Walk me through it: a similar network, step by step
  function mini(state, hl, dim) { return svgFor(state, { mini: true, hl: hl, dim: dim }); }
  function cablesOn(state, r) {
    var out = [];
    for (var i = 0; i + 1 < r.length; i++) state.cables.forEach(function (c, k) { if ((c.a === r[i].id && c.b === r[i + 1].id) || (c.b === r[i].id && c.a === r[i + 1].id)) out.push(k); });
    return out;
  }
  function walkMe() {
    M.walked = true;
    var keep = S, steps = [], m = M.m;
    if (m.walk) steps = m.walk();
    else if (m.type === 'tutorial') {
      steps = m.steps.map(function (s, i) { return { text: 'Step ' + (i + 1) + '. ' + s.text, visual: '' }; });
      steps.push({ text: 'The tutorial on the right ticks each step when you do it. The pulsing outline shows where to look next.', visual: '' });
    } else if (m.type === 'challenge') {
      S = fresh({});
      var sw = place('switch', 320, 200, 'Switch'), pr = place('printer', 320, 70, 'Printer');
      var a = place('laptop', 110, 290), b = place('laptop', 530, 290), c = place('laptop', 110, 90);
      var ex = S, list = [pr, a, b, c];
      steps.push({ text: '<b>A similar network.</b> Three laptops and a printer must all be joined.', visual: mini(ex) });
      steps.push({ text: 'Every laptop and the printer has only <b>one</b> socket, so they cannot all plug into each other. Put a <span class="hl">switch</span> in the middle.', visual: mini(ex) });
      list.forEach(function (d, i) { plug(d, sw); steps.push({ text: 'Plug ' + d.name + ' into the switch.', visual: mini(ex, [S.cables.length - 1]) }); });
      var r = route(a, pr);
      steps.push({ text: 'Test: ' + a.name + ' prints. The data goes ' + r.map(function (d) { return d.name; }).join(' &rarr; ') + '.', visual: mini(ex, cablesOn(ex, r)) });
      steps.push({ text: 'Test every laptop before you check: one check only. Now build yours.', visual: '' });
    } else if (m.id === 'predict' || m.id === 'fixw') {
      m.setup(); var ex2 = S, p = S.jobs.filter(function (j) { return !route(j[0], j[1]); })[0], q = S.jobs.filter(function (j) { return route(j[0], j[1]); })[0];
      steps.push({ text: '<b>A similar network.</b> ' + jobText(q[0], q[1]) + '. ' + jobText(p[0], p[1]) + '. Will each work?', visual: mini(ex2) });
      var rq = route(q[0], q[1]);
      steps.push({ text: 'Follow the cables from ' + q[0].name + ': ' + rq.map(function (d) { return d.name; }).join(' &rarr; ') + '. It gets there, so <span class="hl">Yes</span>.', visual: mini(ex2, cablesOn(ex2, rq)) });
      steps.push({ text: 'Now ' + p[0].name + '. ' + why(p[0], p[1]) + ' So <span class="hl">No</span>.', visual: mini(ex2) });
      steps.push({ text: m.id === 'fixw' ? 'To fix it: plug in anything that is not plugged in, and move a tablet inside a Wi-Fi point\'s dotted circle.' : 'To fix it, every laptop and the printer must be plugged into the switch. Unplug a wrong cable (click it, then Delete), then plug each device into the switch.', visual: '' });
      steps.push({ text: 'Test with Send and Print, then check. Now do the same on your network.', visual: '' });
    } else {
      rooms(); var ex3 = S, lap = laptops()[0], prn = S.devs.filter(function (d) { return d.kind === 'printer'; })[0];
      var s1 = S.devs.filter(function (d) { return d.name === 'Switch 1'; })[0], s2 = S.devs.filter(function (d) { return d.name === 'Switch 2'; })[0];
      steps.push({ text: '<b>A similar network.</b> Can ' + lap.name + ' print?', visual: mini(ex3) });
      steps.push({ text: lap.name + '\'s cable goes to Switch 1. Switch 1 joins only the devices in Room 1.', visual: mini(ex3, cablesOf(lap.id).map(function (c) { return S.cables.indexOf(c); })) });
      steps.push({ text: 'No cable joins Room 1 to Room 2, so ' + lap.name + ' cannot reach the Printer: <span class="hl">No</span>.', visual: mini(ex3) });
      steps.push({ text: 'A switch has eight sockets, so it has room for one more cable. A cable from <span class="hl">Switch 1 to Switch 2</span> joins the two networks into one.', visual: '' });
      plug(s1, s2);
      var r3 = route(lap, prn);
      steps.push({ text: 'Now ' + lap.name + ' prints: ' + r3.map(function (d) { return d.name; }).join(' &rarr; ') + '.', visual: mini(ex3, cablesOn(ex3, r3)) });
      steps.push({ text: 'Now predict and fix your own network.', visual: '' });
    }
    S = keep;
    Lab.walk('Walk me through it', m.type === 'tutorial' ? 'The steps of this mission.' : 'A different network.', steps, function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }

  shell();
  var first = 0;
  while (first < LIST.length - 1 && done[first]) first++;
  start(first);
})();
