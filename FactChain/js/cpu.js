// Fact Chain CPU diagram: one SVG with a part for each diagram id in PACK-FORMAT.md. Parts light up (class is-lit),
// can be drawn faded (is-off, for "Build your CPU"), and two short animations run on timers only (never rAF, so a
// hidden frame never waits on them): the bus trip (address out, instruction back) and the boot.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var IDS = ['cpu', 'pc', 'mar', 'mdr', 'cir', 'acc', 'alu', 'cu', 'clock', 'cache', 'core', 'addressBus', 'dataBus', 'controlBus', 'ram', 'sensor', 'adc', 'actuator', 'device'];
  // A pack's `part` may be a diagram id or one of these names for a group of parts.
  var PART_GROUPS = {
    buses: ['addressBus', 'dataBus', 'controlBus', 'ram'],
    registers: ['pc', 'mar', 'mdr', 'cir', 'acc'],
    control: ['sensor', 'adc', 'actuator', 'device'],
    sensors: ['sensor', 'adc', 'actuator', 'device'],
    embedded: ['device'],
    performance: ['clock', 'cache', 'core'],
    instructions: ['cu', 'cir']
  };
  function partIds(part) {
    if (PART_GROUPS[part]) return PART_GROUPS[part];
    return IDS.indexOf(part) >= 0 ? [part] : [];
  }

  function box(id, x, y, w, h, label, sub) {
    return '<g class="fc-part" id="fc-' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + (sub ? -2 : 5)) + '" text-anchor="middle">' + label + '</text>' +
      (sub ? '<text class="fc-sub" x="' + (x + w / 2) + '" y="' + (y + h / 2 + 13) + '" text-anchor="middle">' + sub + '</text>' : '') + '</g>';
  }
  function bus(id, y, label, both) {
    return '<g class="fc-part fc-bus" id="fc-' + id + '"><line x1="404" y1="' + y + '" x2="516" y2="' + y + '"/>' +
      '<path d="M508 ' + (y - 6) + ' L518 ' + y + ' L508 ' + (y + 6) + '"/>' +
      (both ? '<path d="M412 ' + (y - 6) + ' L402 ' + y + ' L412 ' + (y + 6) + '"/>' : '') +
      '<text class="fc-sub" x="460" y="' + (y - 8) + '" text-anchor="middle">' + label + '</text></g>';
  }

  function svg() {
    return '<svg class="fc-cpu" viewBox="0 0 640 330" role="img" aria-label="A diagram of a computer: the CPU, its buses, memory and devices">' +
      '<g class="fc-part fc-cpu-box" id="fc-cpu"><rect x="8" y="8" width="394" height="232" rx="12"/><text x="22" y="30">CPU</text></g>' +
      '<g class="fc-part fc-core" id="fc-core"><rect x="20" y="40" width="370" height="150" rx="9"/><text class="fc-sub" x="378" y="56" text-anchor="end">core</text></g>' +
      box('cu', 32, 62, 108, 54, 'CU', 'control unit') +
      box('alu', 32, 124, 108, 54, 'ALU', 'arithmetic logic') +
      box('pc', 152, 62, 70, 34, 'PC') +
      box('mar', 230, 62, 70, 34, 'MAR') +
      box('mdr', 308, 62, 70, 34, 'MDR') +
      box('cir', 152, 104, 70, 34, 'CIR') +
      box('acc', 230, 104, 70, 34, 'ACC') +
      '<text class="fc-sub" x="266" y="160" text-anchor="middle">registers</text>' +
      box('clock', 32, 198, 108, 34, 'Clock') +
      box('cache', 152, 198, 226, 34, 'Cache') +
      bus('addressBus', 70, 'address bus', false) +
      bus('dataBus', 120, 'data bus', true) +
      bus('controlBus', 170, 'control bus', true) +
      box('ram', 520, 40, 110, 160, 'RAM', 'memory') +
      box('sensor', 8, 272, 100, 46, 'Sensor') +
      box('adc', 126, 272, 100, 46, 'ADC') +
      box('actuator', 404, 272, 108, 46, 'Actuator') +
      box('device', 530, 272, 100, 46, 'Device') +
      '<g class="fc-flow"><path d="M108 295 H124"/><path d="M226 295 H250 V244"/><path d="M360 244 V295 H402"/><path d="M512 295 H528"/></g>' +
      '<circle class="fc-packet" id="fc-packet" r="7" cx="404" cy="70"/>' +
      '<text class="fc-packet-label" id="fc-packet-label" x="460" y="96" text-anchor="middle"></text>' +
      '</svg>';
  }

  function make(container) {
    container.innerHTML = svg();
    var root = container.querySelector('svg'), timers = [];
    function part(id) { return root.querySelector('#fc-' + id); }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    var api = {
      el: root,
      // Light exactly these parts (others go dark).
      light: function (ids) {
        IDS.forEach(function (id) { var p = part(id); if (p) p.classList.toggle('is-lit', (ids || []).indexOf(id) >= 0); });
      },
      // Add to what is lit.
      add: function (ids) { (ids || []).forEach(function (id) { var p = part(id); if (p) p.classList.add('is-lit'); }); },
      // Build your CPU: parts not yet earned are drawn faded.
      built: function (ids) {
        IDS.forEach(function (id) { var p = part(id); if (p) p.classList.toggle('is-off', ids.indexOf(id) < 0); });
      },
      stop: function () { timers.forEach(clearTimeout); timers = []; root.classList.remove('is-booting'); },
      // Replays the chain: each line's parts in turn, then all of them.
      replay: function (chain, done) {
        api.stop();
        var all = [];
        chain.forEach(function (c, i) {
          later(function () { api.light(c.hl || []); }, i * 450);
          (c.hl || []).forEach(function (id) { if (all.indexOf(id) < 0) all.push(id); });
        });
        later(function () { api.light(all); if (done) done(); }, chain.length * 450 + 200);
      },
      // The fetch trip: the address goes out on the address bus, the instruction comes back on the data bus.
      trip: function (done) {
        api.stop();
        var dot = part('packet'), label = root.querySelector('#fc-packet-label');
        function at(x, y, txt, ms) { later(function () { dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.style.cx = x + 'px'; dot.style.cy = y + 'px'; label.textContent = txt; label.setAttribute('y', y + 26); }, ms); }
        later(function () { api.light(['pc', 'mar']); dot.classList.add('is-on'); }, 0);
        at(404, 70, 'address', 50);
        later(function () { api.light(['mar', 'addressBus']); }, 400);
        at(516, 70, 'address', 450);
        later(function () { api.light(['addressBus', 'ram', 'controlBus']); }, 1300);
        at(516, 120, 'instruction', 1400);
        later(function () { api.light(['ram', 'dataBus']); }, 1800);
        at(404, 120, 'instruction', 1850);
        later(function () { api.light(['dataBus', 'mdr']); }, 2700);
        later(function () { api.light(['mdr', 'cir']); dot.classList.remove('is-on'); label.textContent = ''; }, 3200);
        later(function () { api.light(['cir', 'cu']); if (done) done(); }, 3700);
      },
      // Every part lights in turn, the clock ticks, then the whole CPU glows.
      boot: function (done) {
        api.stop();
        root.classList.add('is-booting');
        var order = ['clock', 'cu', 'pc', 'mar', 'addressBus', 'ram', 'dataBus', 'mdr', 'cir', 'alu', 'acc', 'cache', 'controlBus', 'sensor', 'adc', 'actuator', 'device', 'core', 'cpu'];
        api.light([]);
        order.forEach(function (id, i) { later(function () { api.add([id]); }, 150 + i * 160); });
        later(function () { root.classList.remove('is-booting'); root.classList.add('is-booted'); if (done) done(); }, 300 + order.length * 160);
      }
    };
    api.light([]);
    return api;
  }

  window.FactChainCpu = { make: make, partIds: partIds, IDS: IDS };
})();
