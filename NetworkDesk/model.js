// Network Help Desk (Year 6 networks 2.1, 2.2 and search 2.4): the rules of the game, ported from the LAN party server
// (mp4party DeskModel.cs, DeskSearch.cs, the fallbacks in DeskAi.cs and the scoring in LobbyDesk.cs).
// ONE file used twice: this is NetworkDeskModel.gs in the shell, and the pages repo's NetworkDesk/model.js is an exact
// copy (tools/test-network-desk.mjs fails if they differ). The page runs it for instant feedback on the computer
// screen; the shell (NetworkDesk.gs) replays every change the page sends and decides everything that scores: deliveries,
// "It is fixed", the 2.4 answer check, the explanation marks and the points. Searches use the site's own
// SearchEngine/engine.js (NetworkDeskSearch.gs in the shell is an exact copy of it).
// Everything is plain data (a job is JSON), so the shell can keep it in CacheService between requests.
var NetDesk = (function () {
  'use strict';
  var WIFI_RANGE = 9;
  function se() { return typeof SearchEngine !== 'undefined' ? SearchEngine : null; }
  function has(list, x) { return list.indexOf(x) >= 0; }

  // ---------------------------------------------------------------- devices and names
  function ports(kind) { return kind === 'switch4' ? 4 : kind === 'switch8' ? 8 : kind === 'router' ? 3 : 1; }
  var KIND_NAMES = { cable: 'network cable', switch4: '4-socket switch', switch8: '8-socket switch', wifi: 'Wi-Fi point', router: 'router', laptop: 'laptop', tablet: 'tablet', printer: 'printer', desktop: 'computer', socket: 'internet socket' };
  function kindName(k, cap) { var s = KIND_NAMES[k] || String(k); return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function dev(j, id) { for (var i = 0; i < j.devices.length; i++) if (j.devices[i].id === id) return j.devices[i]; return null; }
  function roomAt(j, x, y) { for (var i = 0; i < j.rooms.length; i++) { var r = j.rooms[i]; if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return r; } return null; }
  function gapKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function used(j, id) { return j.cables.filter(function (c) { return c.a === id || c.b === id; }).length; }
  function roomName(j, id) { for (var i = 0; i < j.rooms.length; i++) if (j.rooms[i].id === id) return j.rooms[i].name; return id; }
  function newId(j, p) { return p + (j.next++); }
  function dist(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }
  function addStock(j, kind, n) { j.stock[kind] = (j.stock[kind] || 0) + (n == null ? 1 : n); }

  // ---------------------------------------------------------------- what reaches what
  // Broken cables carry nothing; a tablet joins the nearest Wi-Fi point in range; data reaches the internet socket only
  // through a router, with the line on.
  function adjacency(j) {
    var adj = {};
    j.devices.forEach(function (d) { adj[d.id] = []; });
    j.cables.forEach(function (c) { if (!c.broken && adj[c.a] && adj[c.b]) { adj[c.a].push(c.b); adj[c.b].push(c.a); } });
    j.devices.filter(function (d) { return d.kind === 'tablet'; }).forEach(function (t) {
      var best = null, bd = Infinity;
      j.devices.forEach(function (d) { if (d.kind === 'wifi') { var dd = dist(d, t); if (dd <= WIFI_RANGE && dd < bd) { bd = dd; best = d; } } });
      if (best) { adj[t.id].push(best.id); adj[best.id].push(t.id); }
    });
    return adj;
  }
  function walk(j, from, to) {
    var adj = adjacency(j), prev = {}, q = [from];
    prev[from] = null;
    while (q.length) {
      var n = q.shift(), nd = dev(j, n);
      if (to != null && n === to) { var p = []; for (var x = n; x != null; x = prev[x]) p.unshift(x); return { seen: prev, path: p }; }
      if (nd.kind === 'socket') continue;
      adj[n].forEach(function (m) {
        var md = dev(j, m);
        if (md.kind === 'socket' && (!j.lineOn || nd.kind !== 'router')) return;
        if (!(m in prev)) { prev[m] = n; q.push(m); }
      });
    }
    return { seen: prev, path: null };
  }
  function reach(j, from) { return Object.keys(walk(j, from, null).seen); }
  function webOk(j, from) { return reach(j, from).some(function (id) { return dev(j, id).kind === 'socket'; }); }

  // The customer's needs not met yet, in the lesson's words (empty: the job is fixed).
  function problems(j) {
    if (j.lesson === '2.4') return searchProblems(j);
    var o = [], mine = j.devices.filter(function (d) { return d.customer; });
    if (!mine.length) return o;
    var first = mine[0], r = reach(j, first.id);
    mine.slice(1).forEach(function (d) { if (!has(r, d.id)) o.push(d.name + ' cannot send to ' + first.name + '.'); });
    if (!o.length && mine.length > 1) {
      mine.forEach(function (d) {
        var rd = reach(j, d.id);
        for (var i = 0; i < mine.length; i++) { var e = mine[i]; if (e !== d && !has(rd, e.id)) { o.push(d.name + ' cannot send to ' + e.name + '.'); break; } }
      });
    }
    mine.filter(function (d) { return d.web; }).forEach(function (d) { if (!webOk(j, d.id)) o.push(d.name + ' cannot open websites.'); });
    return o.filter(function (x, i) { return o.indexOf(x) === i; });
  }

  // A test message from one device to another (to = 'web' for a website): does it arrive, and if not, why.
  function test(j, from, to) {
    var a = dev(j, from), b = to === 'web' ? j.devices.filter(function (d) { return d.kind === 'socket'; })[0] || null : dev(j, to);
    if (!a || !b) return { ok: false, why: 'Choose two devices.', path: [] };
    var path = walk(j, a.id, b.id).path;
    if (path) return { ok: true, why: to === 'web' ? a.name + ' opened a website.' : 'The message arrived at ' + b.name + '.', path: path };
    var why;
    if (a.kind === 'tablet' && !j.devices.some(function (d) { return d.kind === 'wifi' && dist(d, a) <= WIFI_RANGE; })) why = a.name + ' is out of range of every Wi-Fi point.';
    else if (a.kind !== 'tablet' && used(j, a.id) === 0) why = a.name + ' has no cable in its socket.';
    else if (j.cables.some(function (c) { return c.broken && (c.a === a.id || c.b === a.id); })) why = 'The cable from ' + a.name + ' is broken.';
    else if (to === 'web') why = !j.devices.some(function (d) { return d.kind === 'router'; }) ? 'A network needs a router to reach the internet.' : !j.lineOn ? 'The internet line into the building is off.' : 'The message never reached the internet socket.';
    else why = 'There is no way through the network from ' + a.name + ' to ' + b.name + '.';
    return { ok: false, why: why, path: [] };
  }

  // ---------------------------------------------------------------- changes the pupil makes (each answers null or why not)
  function near(j, x, y, not) { return j.devices.some(function (d) { return d !== not && Math.abs(d.x - x) < 1.6 && Math.abs(d.y - y) < 1.6; }); }
  function place(j, kind, x, y) {
    var n = j.stock[kind] || 0;
    if (n <= 0) return 'You have no ' + kindName(kind) + ' yet. Ask Supplies for one.';
    var room = roomAt(j, x, y); if (!room) return 'Put it inside a room.';
    if (near(j, x, y, null)) return 'There is something there already.';
    j.stock[kind] = n - 1;
    j.devices.push({ id: newId(j, 'p'), kind: kind, name: kindName(kind, true), room: room.id, x: x, y: y, customer: false, web: false, loose: false });
    return null;
  }
  function move(j, id, x, y) {
    var d = dev(j, id); if (!d) return 'That is not there.';
    if (d.customer) return 'That belongs to the customer. Leave it where it is.';
    var room = roomAt(j, x, y); if (!room) return 'Put it inside a room.';
    if (near(j, x, y, d)) return 'There is something there already.';
    d.x = x; d.y = y; d.room = room.id;
    j.cables.filter(function (c) { return c.a === id || c.b === id; }).forEach(function (c) {
      var o = dev(j, c.a === id ? c.b : c.a);
      if (o.room !== d.room && !has(j.openGaps, gapKey(o.room, d.room))) { j.cables.splice(j.cables.indexOf(c), 1); if (!c.broken) addStock(j, 'cable'); }
    });
    return null;
  }
  function remove(j, id) {
    var d = dev(j, id); if (!d) return 'That is not there.';
    if (d.customer || d.kind === 'socket') return 'That belongs to the customer. Leave it where it is.';
    j.cables.filter(function (c) { return c.a === id || c.b === id; }).forEach(function (c) { j.cables.splice(j.cables.indexOf(c), 1); if (!c.broken) addStock(j, 'cable'); });
    j.devices.splice(j.devices.indexOf(d), 1); addStock(j, d.kind);
    return null;
  }
  function connect(j, a, b) {
    var da = dev(j, a), db = dev(j, b);
    if (!da || !db || a === b) return 'Join two different things.';
    var n = j.stock.cable || 0;
    if (n <= 0) return 'You have no network cable. Ask Supplies for one.';
    if (j.cables.some(function (c) { return !c.broken && ((c.a === a && c.b === b) || (c.a === b && c.b === a)); })) return 'Those two are joined already.';
    if ((da.kind === 'socket' && db.kind !== 'router') || (db.kind === 'socket' && da.kind !== 'router')) return j.lesson === '2.2' ? 'Only a router can join a network to the internet socket.' : 'That socket is not for this job.';
    if (da.kind === 'tablet' || db.kind === 'tablet') return 'A tablet joins the network by Wi-Fi, not by cable.';
    if (da.room !== db.room && !has(j.openGaps, gapKey(da.room, db.room))) return 'The wall between the ' + roomName(j, da.room) + ' and the ' + roomName(j, db.room) + ' has no cable hole. Ask the Building Manager.';
    var both = [da, db];
    for (var i = 0; i < 2; i++) {
      var d = both[i];
      if (used(j, d.id) >= ports(d.kind)) return d.name + ' has no free socket.' + (j.cables.some(function (c) { return c.broken && (c.a === d.id || c.b === d.id); }) ? ' Take the broken cable out first.' : d.kind.indexOf('switch') === 0 ? ' Every socket on it is in use.' : '');
    }
    j.stock.cable = n - 1;
    j.cables.push({ id: newId(j, 'c'), a: a, b: b, broken: false });
    return null;
  }
  function unplug(j, id) {
    var c = j.cables.filter(function (x) { return x.id === id; })[0]; if (!c) return 'That cable is not there.';
    j.cables.splice(j.cables.indexOf(c), 1); if (!c.broken) addStock(j, 'cable');
    return null;
  }
  function num(v) { v = Number(v); return isFinite(v) ? Math.round(v * 10) / 10 : NaN; }
  function str(v, n) { return String(v == null ? '' : v).slice(0, n || 80); }
  // One change from the page: { op: place|move|remove|connect|unplug|search, ... }. Both sides run exactly this.
  function applyOp(j, o) {
    if (!o || typeof o !== 'object') return '?';
    if (o.op === 'search') {
      if (!j.caseId) return '?';
      var q = str(o.q, 120).trim(); if (!q) return '?';
      j.searches.push(q); if (j.searches.length > 60) j.searches.shift();
      return null;
    }
    if (j.lesson === '2.4') return '?';
    if (o.op === 'place') return place(j, str(o.kind), num(o.x), num(o.y));
    if (o.op === 'move') return move(j, str(o.id), num(o.x), num(o.y));
    if (o.op === 'remove') return remove(j, str(o.id));
    if (o.op === 'connect') return connect(j, str(o.a), str(o.b));
    if (o.op === 'unplug') return unplug(j, str(o.id));
    return '?';
  }

  // ---------------------------------------------------------------- the businesses and their faults
  // A floor plan is 32 x 20: two rooms with a wall between them; the second room has the far corner a tablet wanders to.
  function spot(kind, name, room, x, y, web) { return { kind: kind, name: name, room: room, x: x, y: y, web: !!web }; }
  var PLACES = [
    { business: 'Sunny Loaf Bakery', kind: 'bakery', customer: 'Maria', role: 'the baker', look: 'baker',
      rooms: [['shop', 'shop', 0, 0, 19, 20], ['bake', 'bakehouse', 19, 0, 32, 20]],
      spots: [spot('laptop', 'Till laptop', 'shop', 5, 14, true), spot('tablet', 'Order tablet', 'shop', 9, 6), spot('printer', 'Kitchen printer', 'bake', 25, 6), spot('desktop', 'Office computer', 'bake', 27, 15, true)],
      sw: [14, 10], wifi: [11, 4], router: [15, 16], socket: [17, 18], far: [30, 2] },
    { business: 'Riverside Library', kind: 'library', customer: 'Mr Okafor', role: 'the librarian', look: 'librarian',
      rooms: [['hall', 'reading room', 0, 0, 20, 20], ['office', 'office', 20, 0, 32, 20]],
      spots: [spot('desktop', 'Front desk computer', 'hall', 4, 4, true), spot('tablet', 'Story tablet', 'hall', 10, 14), spot('printer', 'Library printer', 'office', 26, 5), spot('laptop', "Librarian's laptop", 'office', 28, 15, true)],
      sw: [15, 9], wifi: [9, 9], router: [15, 16], socket: [18, 18], far: [30, 18] },
    { business: 'Bean There Café', kind: 'cafe', customer: 'Jin', role: 'the café owner', look: 'barista',
      rooms: [['cafe', 'café', 0, 0, 20, 20], ['kitchen', 'kitchen', 20, 0, 32, 20]],
      spots: [spot('laptop', 'Till laptop', 'cafe', 4, 15, true), spot('tablet', 'Menu tablet', 'cafe', 8, 5), spot('printer', 'Kitchen printer', 'kitchen', 26, 4), spot('desktop', 'Stock computer', 'kitchen', 28, 16, true)],
      sw: [15, 10], wifi: [10, 10], router: [15, 16], socket: [18, 18], far: [30, 18] },
    { business: 'Paws and Claws Vets', kind: 'vets', customer: 'Dr Patel', role: 'the vet', look: 'vet',
      rooms: [['reception', 'reception', 0, 0, 18, 20], ['surgery', 'surgery', 18, 0, 32, 20]],
      spots: [spot('desktop', 'Reception computer', 'reception', 4, 5, true), spot('tablet', 'Check-in tablet', 'reception', 6, 15), spot('printer', 'Label printer', 'surgery', 24, 5), spot('laptop', "Vet's laptop", 'surgery', 27, 14, true)],
      sw: [13, 10], wifi: [9, 9], router: [14, 16], socket: [16, 18], far: [30, 2] },
    { business: 'Greenfield School Office', kind: 'school', customer: 'Mrs Wong', role: 'the school secretary', look: 'secretary',
      rooms: [['front', 'front office', 0, 0, 18, 20], ['head', "head teacher's office", 18, 0, 32, 20]],
      spots: [spot('desktop', 'Office computer', 'front', 4, 5, true), spot('tablet', 'Visitor tablet', 'front', 5, 15), spot('printer', 'Office printer', 'front', 12, 4), spot('laptop', "Head teacher's laptop", 'head', 26, 12, true)],
      sw: [13, 10], wifi: [8, 10], router: [14, 16], socket: [16, 18], far: [30, 18] }
  ];
  var FAULTS_21 = ['missing_cable', 'broken_cable', 'wall_gap', 'wifi_range', 'switch_full'];
  var FAULTS_22 = ['no_router', 'line_off'];
  var FAULTS_24 = ['too_vague', 'spelling', 'wrong_meaning'];

  function randId(rnd) { var s = ''; for (var i = 0; i < 8; i++) s += '0123456789abcdef'.charAt(rnd(16)); return s; }
  function blankJob(rnd, lesson, fault, pl) {
    return { id: randId(rnd), business: pl.business, kind: pl.kind, fault: fault, lesson: lesson, customerName: pl.customer, customerRole: pl.role, look: pl.look,
      rooms: [], devices: [], cables: [], openGaps: [], gaps: [], lineOn: true, stock: {}, useful: [], changed: '', symptom: '', caseId: '', searches: [], next: 1 };
  }
  // A new job: a business (not the same as last time), a working network, then the fault breaks it. rnd(n): 0..n-1.
  function makeJob(rnd, lesson, fault, notBusiness) {
    var choices = PLACES.filter(function (p) { return p.business !== notBusiness; });
    var pl = choices[rnd(choices.length)], j = blankJob(rnd, lesson, fault, pl);
    pl.rooms.forEach(function (r) { j.rooms.push({ id: r[0], name: r[1], x0: r[2], y0: r[3], x1: r[4], y1: r[5] }); });
    j.gaps.push(gapKey(pl.rooms[0][0], pl.rooms[1][0])); j.openGaps.push(j.gaps[0]);
    var web = lesson === '2.2';
    pl.spots.forEach(function (s) { j.devices.push({ id: newId(j, 'd'), kind: s.kind, name: s.name, room: s.room, x: s.x, y: s.y, customer: true, web: web && s.web, loose: false }); });
    // an 8-socket switch when the fix needs a free socket for something new (a Wi-Fi point); switch_full needs the full 4-socket one
    var swKind = web || fault === 'wifi_range' ? 'switch8' : 'switch4', front = pl.rooms[0][0];
    var sw = { id: newId(j, 'p'), kind: swKind, name: kindName(swKind, true), room: front, x: pl.sw[0], y: pl.sw[1], customer: false, web: false, loose: false };
    var wf = { id: newId(j, 'p'), kind: 'wifi', name: 'Wi-Fi point', room: front, x: pl.wifi[0], y: pl.wifi[1], customer: false, web: false, loose: false };
    j.devices.push(sw, wf);
    function wire(a, b) { j.cables.push({ id: newId(j, 'c'), a: a.id, b: b.id, broken: false }); }
    j.devices.filter(function (d) { return d.customer && d.kind !== 'tablet'; }).forEach(function (d) { wire(d, sw); });
    wire(wf, sw);
    if (web) {
      var sk = { id: newId(j, 's'), kind: 'socket', name: 'Internet socket', room: front, x: pl.socket[0], y: pl.socket[1], customer: false, web: false, loose: false };
      var rt = { id: newId(j, 'p'), kind: 'router', name: 'Router', room: front, x: pl.router[0], y: pl.router[1], customer: false, web: false, loose: false };
      j.devices.push(sk, rt); wire(sw, rt); wire(rt, sk);
    }
    var wired = j.devices.filter(function (d) { return d.customer && d.kind !== 'tablet'; });
    var back = wired.filter(function (d) { return d.room === pl.rooms[1][0]; });
    function pick(l) { return l[rnd(l.length)]; }
    function cableOf(d) { return j.cables.filter(function (c) { return c.a === d.id || c.b === d.id; })[0]; }
    function drop(c) { j.cables.splice(j.cables.indexOf(c), 1); }
    var d;
    if (fault === 'missing_cable') {
      d = pick(wired); drop(cableOf(d));
      j.useful = ['cable']; j.changed = 'Someone tidied up all the cables last night.'; j.symptom = d.name + ' stopped working with everything else this morning.';
    } else if (fault === 'broken_cable') {
      d = pick(wired); cableOf(d).broken = true;
      j.useful = ['cable']; j.changed = "The cleaner's hoover went over the cables on the floor last night, and a chair was rolled over them."; j.symptom = d.name + ' cannot send anything to the others.';
    } else if (fault === 'wall_gap') {
      back.forEach(function (o) { drop(cableOf(o)); });   // every cable through that wall is gone
      j.openGaps = [];
      j.useful = ['cable']; j.changed = 'The ' + roomName(j, pl.rooms[1][0]) + ' was decorated. The builders filled in the hole in the wall where the cables went through, and took the old cables away.';
      j.symptom = 'Nothing in the ' + roomName(j, pl.rooms[1][0]) + ' can reach anything in the ' + roomName(j, front) + '.';
    } else if (fault === 'wifi_range') {
      var t = j.devices.filter(function (x) { return x.kind === 'tablet'; })[0];
      t.x = pl.far[0]; t.y = pl.far[1]; t.room = roomAt(j, t.x, t.y).id;
      j.useful = ['wifi', 'cable'];
      j.changed = 'We started using the ' + t.name.toLowerCase() + ' in the far corner of the ' + roomName(j, t.room) + '.'; j.symptom = t.name + ' says it has no network. It works fine when it is carried back to the ' + roomName(j, front) + '.';
    } else if (fault === 'switch_full') {
      var r0 = j.rooms[0];
      var nd = { id: newId(j, 'd'), kind: 'laptop', name: 'New laptop', room: r0.id, x: pl.sw[0] - 4, y: Math.min(r0.y1 - 2, pl.sw[1] + 6), customer: true, web: false, loose: true };
      if (j.devices.some(function (o) { return Math.abs(o.x - nd.x) < 2 && Math.abs(o.y - nd.y) < 2; })) { nd.x = pl.sw[0] - 6; nd.y = pl.sw[1] - 6; }
      j.devices.push(nd);
      j.useful = ['switch4', 'switch8', 'cable'];
      j.changed = 'We bought a new laptop this week.'; j.symptom = 'The new laptop cannot join the network. There is nowhere on the switch to plug its cable in.';
    } else if (fault === 'no_router') {
      var rtr = j.devices.filter(function (x) { return x.kind === 'router'; })[0];
      j.cables = j.cables.filter(function (c) { return c.a !== rtr.id && c.b !== rtr.id; }); j.devices.splice(j.devices.indexOf(rtr), 1);
      j.useful = ['router', 'cable'];
      j.changed = 'We have just had an internet line put into the building, but nobody set anything up.'; j.symptom = 'None of our computers can open websites. Sending things to each other works fine.';
    } else if (fault === 'line_off') {
      j.lineOn = false;
      j.changed = 'Nothing has changed here. Everything was fine yesterday.'; j.symptom = 'None of our computers can open websites this morning. Sending things to each other still works.';
    }
    ['cable', 'switch4', 'switch8', 'wifi', 'router'].forEach(function (k) { j.stock[k] = 0; });   // everything comes from Supplies
    return j;
  }

  // ---------------------------------------------------------------- lesson 2.4: a customer's bad search
  function kase(id, fault, query, target, want, answer, answerRx, good) { return { id: id, fault: fault, query: query, target: target, want: want, answer: answer, answerRx: answerRx, good: good }; }
  var CASES = [
    // too_vague: one word that many pages have
    kase('tv_dentist', 'too_vague', 'times', 'dentist', 'what time the dentist opens', '10 am', '\\b10\\b|\\bten\\b', 'dentist'),
    kase('tv_zoo', 'too_vague', 'ticket', 'zoo', 'how much a child ticket for the zoo costs', '100 baht', '\\b100\\b|hundred', 'zoo ticket'),
    kase('tv_training', 'too_vague', 'football', 'training', 'what day football training for children is', 'Wednesday', 'wednesday|wed\\b', 'football training'),
    kase('tv_books', 'too_vague', 'library', 'books', 'how many books you can borrow from the library', '6 books', '\\b6\\b|\\bsix\\b', 'borrow books'),
    // spelling: a word that is on no page
    kase('sp_volcano', 'spelling', 'vulcano facts', 'volcano', 'what the hot rock from a volcano is called', 'lava', '\\blava\\b', 'volcano'),
    kase('sp_dentist', 'spelling', 'dentsit opening times', 'dentist', 'what time the dentist opens', '10 am', '\\b10\\b|\\bten\\b', 'dentist opening times'),
    kase('sp_tiger', 'spelling', 'tigre', 'tiger', 'how heavy a big tiger can be', '300 kg', '\\b300\\b', 'tiger'),
    // wrong_meaning: mouse, the animal or the computer part
    kase('wm_fix', 'wrong_meaning', 'mouse', 'fixmouse', 'what to do when a computer mouse stops working', 'put in new batteries', 'batter', 'fix mouse'),
    kase('wm_buy', 'wrong_meaning', 'mouse', 'buymouse', 'how much a computer mouse costs', '350 baht', '\\b350\\b', 'buy mouse')
  ];
  function caseOf(j) { for (var i = 0; i < CASES.length; i++) if (CASES[i].id === j.caseId) return CASES[i]; return null; }
  var PEOPLE = PLACES.map(function (p) { return { business: p.business, kind: p.kind, customer: p.customer, role: p.role, look: p.look }; });
  function topTitles(q) { return se().search(q).results.slice(0, 3).map(function (h) { return h.page.title; }); }
  function makeSearchJob(rnd, fault, notBusiness, seen) {
    var all = CASES.filter(function (c) { return c.fault === fault; });
    var fresh = all.filter(function (c) { return !has(seen, c.id); }); if (!fresh.length) fresh = all;
    var c = fresh[rnd(fresh.length)]; if (!has(seen, c.id)) seen.push(c.id);
    var ppl = PEOPLE.filter(function (p) { return p.business !== notBusiness; }), pl = ppl[rnd(ppl.length)];
    var j = blankJob(rnd, '2.4', fault, pl), top = topTitles(c.query);
    j.caseId = c.id;
    j.symptom = 'I want to find ' + c.want + ', but my search did not find it.';
    j.changed = top.length ? 'These came up: ' + top.join('; ') + '.' : 'Nothing came up. It said no pages have that word.';
    return j;
  }
  // A good search: the page they want first, at most 4 words, no small words, every word on a page.
  function whyNotGood(j, q) {
    var r = se().read(q);
    if (!r.typed.length) return 'Type some search terms first.';
    if (r.unknown.length) return 'No page has the word "' + r.unknown[0] + '".';
    if (r.small.length) return 'It still has small words.';
    if (r.typed.length > 4) return 'It has more than 4 words.';
    return se().rankOf(q, caseOf(j).target) === 1 ? null : 'The page they want is not first.';
  }
  // The pupil tells the customer the answer and the search terms; both are checked.
  function tellCheck(j, msg) {
    var c = caseOf(j), answer = new RegExp(c.answerRx, 'i').test(msg), said = se().words(msg);
    var terms = j.searches.filter(function (s) { return whyNotGood(j, s) === null; }).some(function (s) { return se().words(s).every(function (w) { return has(said, w); }); });
    if (answer && terms) return { ok: true, mistake: false, reply: '' };
    if (answer) return { ok: false, mistake: false, reply: 'Thank you! But what should I type in the search box next time, so that page comes first? Please tell me the search terms you used.' };
    if (terms) return { ok: false, mistake: false, reply: 'Those search terms sound good. But what is the answer? Please read it from the page and tell me: ' + c.want + '.' };
    return { ok: false, mistake: true, reply: 'Sorry, I do not understand yet. I want to know ' + c.want + '. What is the answer, and which search terms should I type?' };
  }
  function searchProblems(j) { return j.searches.some(function (s) { return whyNotGood(j, s) === null; }) ? [] : ['No search has put the page they want first yet.']; }
  function whyExample(fault) {
    return fault === 'too_vague' ? 'Your search had only one word. Lots of pages have that word, so the page you wanted was not first.'
      : fault === 'spelling' ? 'A word was spelt wrong, so no page had that word and the page you wanted did not come up.'
      : 'Mouse has two meanings, an animal and a computer part, so the animal page came first.';
  }

  // ---------------------------------------------------------------- what the game knows about each fault
  function info(j) {
    var c = caseOf(j);
    if (c) {
      var good = '"' + c.good + '"';
      if (j.fault === 'too_vague') return { cause: 'The search "' + c.query + '" had only one word. Many pages have that word, so the page they wanted was not ranked first.', fix: 'Use a few key words that only the page they want has, such as ' + good + '.',
        scheme: ['It says the search had too few words, or was too vague, or many pages have that word.', 'It says the page they wanted was not ranked first, because other pages came first.'],
        words: [['vague', 'one word', 'few', 'more words', 'many pages', 'lots of pages', 'too short', 'not enough', 'other pages have'], ['first', 'rank', 'top', 'other page', 'wrong page']] };
      if (j.fault === 'spelling') return { cause: 'A word in the search "' + c.query + '" was spelt wrong, so no page in the search engine\'s list had that word and the page they wanted was not found.', fix: 'Spell the word right, such as ' + good + '.',
        scheme: ['It says a word was spelt wrong.', 'It says no page in the list has that word, so nothing came up or the page was not found.'],
        words: [['spell', 'spelt', 'spelled', 'typo', 'wrong letter', 'missing letter'], ['no page', 'no result', 'nothing', 'not found', 'could not find', 'list', 'no web page']] };
      return { cause: 'The word "mouse" has two meanings: an animal and a part of a computer. The page about the animal was ranked first.', fix: 'Add one more word that shows which meaning they want, such as ' + good + '.',
        scheme: ['It says the word mouse has two meanings (an animal and a computer mouse).', 'It says the animal page was ranked first, or that one more word like computer puts the right page first.'],
        words: [['two meaning', 'meaning', 'animal', 'two thing', 'means two', 'different thing'], ['first', 'rank', 'computer', 'another word', 'one more word', 'more word']] };
    }
    var back = j.rooms[1].name, front = j.rooms[0].name;
    var tablet = j.devices.filter(function (d) { return d.kind === 'tablet'; })[0];
    var loose = j.devices.filter(function (d) { return d.customer && d.kind !== 'tablet' && used(j, d.id) === 0; })[0];
    var ln = loose ? loose.name : 'device', tn = tablet ? tablet.name : 'tablet';
    switch (j.fault) {
      case 'missing_cable': return { cause: 'The ' + ln + ' has no cable joining it to the switch.', fix: 'Plug a network cable from the ' + ln + ' into a free socket on the switch.',
        scheme: ['It says the device was not connected, had no cable or was unplugged.', 'It says the cable joins it to the switch or network, so it can send.'],
        words: [['cable', 'plug', 'connect', 'unplug', 'wire'], ['switch', 'network', 'send', 'reach', 'join']] };
      case 'broken_cable': return { cause: 'The cable joining the device to the switch is broken.', fix: 'Take the broken cable out and plug in a new network cable.',
        scheme: ['It says the cable was broken or damaged.', 'It says a new cable lets the device send through the network again.'],
        words: [['broken', 'broke', 'damaged', 'cut', 'snapped'], ['new', 'replace', 'changed', 'swap']] };
      case 'wall_gap': return { cause: 'The hole in the wall between the ' + front + ' and the ' + back + ' was filled in, and the cables through it were taken away.', fix: 'Ask the Building Manager to open a cable hole between the ' + front + ' and the ' + back + ', then cable the ' + back + ' devices to the switch.',
        scheme: ['It says the devices in the ' + back + ' had no cable through the wall or were not connected.', 'It says a cable through the wall joins them to the switch or network.'],
        words: [['wall', 'hole', 'cable', 'connect'], ['switch', 'network', 'join', 'through']] };
      case 'wifi_range': return { cause: 'The ' + tn + ' is out of range of the Wi-Fi point.', fix: 'Put a Wi-Fi point near the tablet and join it to the switch with a cable, or move a Wi-Fi point closer.',
        scheme: ['It says the tablet was out of range or too far from the Wi-Fi point.', 'It says a Wi-Fi point closer to it lets it join the network.'],
        words: [['range', 'far', 'away', 'distance'], ['wi-fi point', 'wifi point', 'wi fi point', 'closer', 'near']] };
      case 'switch_full': return { cause: 'Every socket on the 4-socket switch is in use, so the new laptop cannot be plugged in.', fix: 'Swap in an 8-socket switch, or add another switch joined with a cable, then plug the new laptop in.',
        scheme: ['It says the switch was full or had no free socket.', 'It says a bigger switch or another switch gives the laptop a socket.'],
        words: [['full', 'no free', 'no space', 'every socket', 'all the sockets', 'no socket'], ['bigger', '8', 'eight', 'another switch', 'new switch', 'second switch']] };
      case 'no_router': return { cause: 'There is no router joining the network to the internet socket.', fix: 'Put in a router. Cable the switch to the router, and the router to the internet socket.',
        scheme: ['It says there was no router.', 'It says the router joins the network to the internet.'],
        words: [['router'], ['internet', 'website', 'join', 'connect']] };
      default: return { cause: 'The internet line into the building was turned off by the Internet Company.', fix: 'Call the Internet Company, say the business name, and ask them to turn the line on.',
        scheme: ['It says the internet line was off.', 'It says the Internet Company turned it back on, so the network can reach the internet.'],
        words: [['line', 'off'], ['internet company', 'turned on', 'turn on', 'switched on', 'back on']] };
    }
  }

  // ---------------------------------------------------------------- the customer's script (written version; Haiku rewrites it on the shell)
  var QUESTIONS = [['what', 'What stopped working?'], ['which', 'Which things still work?'], ['changed', 'Did anything change recently?'], ['where', 'Where are your things?']];
  var QUESTIONS_24 = [['typed', 'What did you type?'], ['want', 'What do you want to find?'], ['results', 'What came up?'], ['tried', 'Which page came first?']];
  function questionsFor(lesson) { return (lesson === '2.4' ? QUESTIONS_24 : QUESTIONS).map(function (q) { return { id: q[0], label: q[1] }; }); }
  // The facts the customer knows (also what Haiku is told).
  function facts(j) {
    var c = caseOf(j);
    if (c) {
      var top = se().search(c.query).results;
      return { want: c.want, typed: 'I typed: "' + c.query + '"',
        came: top.length ? 'These came up: ' + top.slice(0, 3).map(function (h) { return h.page.title; }).join('; ') + '.' : 'Nothing came up. It said no pages have that word.',
        first: top.length ? 'The first one was "' + top[0].page.title + '". That is not what I wanted.' : 'Nothing came up at all, so there was no first page.' };
    }
    var main = j.devices.filter(function (d) { return d.customer; })[0], r = reach(j, main.id);
    var works = j.devices.filter(function (d) { return d.customer && d !== main && has(r, d.id); }).map(function (d) { return d.name; });
    var fails = j.devices.filter(function (d) { return d.customer && d !== main && !has(r, d.id); }).map(function (d) { return d.name; });
    if (j.lesson === '2.2' && j.devices.some(function (d) { return d.web; }) && !webOk(j, main.id)) fails.push('opening websites');
    var where = j.rooms.map(function (rm) { return 'in the ' + rm.name + ': ' + j.devices.filter(function (d) { return d.customer && d.room === rm.id; }).map(function (d) { return d.name; }).join(', '); }).join('; ');
    return { main: main.name, works: works, fails: fails, where: where };
  }
  function scriptFallback(j) {
    var f = facts(j);
    if (j.caseId) return { opening: 'Hello, this is ' + j.customerName + ' at ' + j.business + '. I searched on the internet, but I cannot find ' + f.want + '. Can you help me, please?',
      answers: { typed: f.typed, want: 'I want to find ' + f.want + '.', results: f.came, tried: f.first }, thanks: 'Thank you so much! Now I know how to search for it myself.' };
    return { opening: 'Hello, this is ' + j.customerName + ' at ' + j.business + '. ' + j.symptom + ' Can you help us, please?',
      answers: { what: j.symptom, which: f.works.length ? 'These still work with the ' + f.main + ': ' + f.works.join(', ') + '.' : 'Nothing can send to the ' + f.main + ' at the moment.', changed: j.changed, where: 'Here is where everything is: ' + f.where + '.' },
      thanks: 'Thank you so much! Everything works again.' };
  }

  // ---------------------------------------------------------------- the offices
  var OFFICES = [
    { id: 'supplies', name: 'Supplies', person: 'Priya', look: 'supplies' },
    { id: 'building', name: 'Building Manager', person: 'Mr Hughes', look: 'builder' },
    { id: 'internet', name: 'Internet Company', person: 'Sam', look: 'internet' },
    { id: 'tech', name: 'Tech Lead', person: 'Alex', look: 'techlead' }
  ];
  function officesFor(lesson) { return OFFICES.filter(function (o) { return lesson === '2.4' ? o.id === 'tech' : o.id !== 'internet' || lesson === '2.2'; }); }
  function catalogue(lesson) { return lesson === '2.2' ? ['cable', 'switch4', 'switch8', 'wifi', 'router'] : ['cable', 'switch4', 'switch8', 'wifi']; }
  function mentions(text, room) {
    var t = String(text).toLowerCase();
    return room.split(' ').filter(function (w) { return w.length > 3 && !/'s$/.test(w); }).some(function (w) { return t.indexOf(w.toLowerCase()) >= 0; }) || t.indexOf(room.toLowerCase()) >= 0;
  }
  function namesBusiness(j, text) { var t = String(text).toLowerCase(); return j.business.split(' ').filter(function (w) { return w.length > 3; }).some(function (w) { return t.indexOf(w.toLowerCase()) >= 0; }); }
  function officeFallback(j, office, msg, all) {
    var t = String(msg).toLowerCase(), send = {};
    if (office === 'supplies') {
      var count = function () {
        var m = /\b(\d+)\b/.exec(t); if (m) return Math.max(1, Math.min(6, parseInt(m[1], 10)));
        var ws = [['one', 1], ['two', 2], ['three', 3], ['four', 4]];
        for (var i = 0; i < ws.length; i++) if (new RegExp('\\b' + ws[i][0] + '\\b').test(t)) return ws[i][1];
        return 1;
      };
      if (t.indexOf('cable') >= 0) send.cable = count();
      if (t.indexOf('switch') >= 0) { if (/\b8\b|eight|bigger|big /.test(t)) send.switch8 = 1; else if (/\b4\b|four/.test(t)) send.switch4 = 1; }
      if (/wi-?fi point|wifi point|wi fi point/.test(t)) send.wifi = 1;
      if (t.indexOf('router') >= 0 && j.lesson === '2.2') send.router = 1;
      if (t.indexOf('switch') >= 0 && !send.switch8 && !send.switch4) return { reply: 'Which switch do you need: one with 4 sockets or one with 8 sockets?', send: send, openHole: false, lineOn: false };
      var ks = Object.keys(send);
      return ks.length ? { reply: 'No problem. I am sending ' + ks.map(function (k) { return send[k] + ' x ' + kindName(k); }).join(' and ') + ' now.', send: send, openHole: false, lineOn: false }
        : { reply: 'Hello, this is Priya at Supplies. What do you need, and what is it for?', send: send, openHole: false, lineOn: false };
    }
    if (office === 'building') {
      var both = j.rooms.every(function (rm) { return mentions(all, rm.name); });
      return both ? { reply: 'Fine. I will open a cable hole in the wall between the ' + j.rooms[0].name + ' and the ' + j.rooms[1].name + '.', send: {}, openHole: true, lineOn: false }
        : { reply: 'This is Mr Hughes. Which two rooms does the cable need to go between, and what is it for?', send: {}, openHole: false, lineOn: false };
    }
    return namesBusiness(j, all) ? { reply: 'Let me check ' + j.business + '. ' + (j.lineOn ? 'The line is already on.' : 'The line was off. I have turned it on now.'), send: {}, openHole: false, lineOn: true }
      : { reply: 'Hello, Internet Company. Which customer are you calling about?', send: {}, openHole: false, lineOn: false };
  }
  // Only what the office may do: items from the catalogue, counts capped, a hole only with both rooms named, the line
  // only with the business named.
  function checkOffice(j, office, r, all) {
    var send = {}, cat = catalogue(j.lesson);
    if (office === 'supplies' && r.send) Object.keys(r.send).forEach(function (k) {
      var n = Math.floor(Number(r.send[k]) || 1);
      if (has(cat, k)) send[k] = Math.max(1, Math.min(k === 'cable' ? 6 : 4, (send[k] || 0) + Math.max(1, n)));
    });
    return { reply: String(r.reply || ''), send: send,
      openHole: office === 'building' && r.openHole === true && j.rooms.every(function (rm) { return mentions(all, rm.name); }),
      lineOn: office === 'internet' && r.lineOn === true && namesBusiness(j, all) };
  }

  // ---------------------------------------------------------------- the Tech Lead's written hints
  function techFallback(j, level) {
    if (level >= 3) return info(j).fix;
    if (j.caseId) {
      if (level === 1) return 'Look at their search and the results on your computer. Is the page they want first? Then try your own search in the Search app.';
      return j.fault === 'too_vague' ? 'Their search has only one word, and lots of pages have that word. Which other key word does only their page have?'
        : j.fault === 'spelling' ? 'Look closely at each word in their search. Is it spelt right?'
        : 'That word can mean two different things. Which meaning do they want?';
    }
    if (level === 1) return 'Use Test on the computer screen. Send a message from one of the customer\'s things to another, and see which ones cannot send. That tells you where to look.';
    switch (j.fault) {
      case 'missing_cable': case 'broken_cable': return 'Look closely at the cables going into the switch. Is every one of the customer\'s things joined to it, and is every cable OK?';
      case 'wall_gap': return 'Look at the wall between the two rooms. Can a cable get through it?';
      case 'wifi_range': return 'Look at the tablet and the Wi-Fi point. How far apart are they?';
      case 'switch_full': return 'Count the sockets on the switch. Is there one free for the new laptop?';
      case 'no_router': return 'Websites are on the internet. What joins a network to the internet?';
      default: return 'The network inside works. Is the internet line into the building working?';
    }
  }
  // The written mark for the explanation: one mark per mark point whose words appear.
  function explainFallback(j, text, thanks) {
    var lower = String(text).toLowerCase(), kw = info(j).words.filter(function (ws) { return ws.some(function (w) { return lower.indexOf(w) >= 0; }); }).length;
    return { marks: kw, reply: kw === 2 ? thanks + ' Thank you for explaining it so clearly.' : kw === 1 ? thanks + ' I think I understand some of it.' : thanks + ' I am not sure I understand what was wrong, but thank you.' };
  }
  // Plain text that is safe to show: one paragraph, no links or markup, at most n characters.
  function clean(s, n) {
    n = n || 420;
    s = String(s == null ? '' : s).replace(/https?:\/\/\S+|www\.\S+/g, '').replace(/[*_#`<>\[\]]/g, '').replace(/[\u2014\u2013]/g, ', ').trim().replace(/\s+/g, ' ');
    if (s.length > n) { var cut = s.slice(0, n), dot = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?')); s = dot > n / 2 ? cut.slice(0, dot + 1) : cut.replace(/\s+$/, '') + '...'; }
    return s;
  }

  // ---------------------------------------------------------------- one pupil's game (the shell keeps it; local practice keeps it in the page)
  // The first two jobs of each lesson are the training calls (the page's guide walks the pupil through them).
  function faultFor(lesson, jobNo, rnd) {
    if (lesson === '2.4') {
      if (jobNo < 2) return jobNo === 0 ? 'too_vague' : 'spelling';
      var o24 = ['wrong_meaning', 'too_vague', 'spelling', 'wrong_meaning', 'too_vague', 'spelling'];
      return jobNo - 2 < o24.length ? o24[jobNo - 2] : FAULTS_24[rnd(FAULTS_24.length)];
    }
    if (jobNo < 2) return jobNo === 0 ? 'missing_cable' : 'broken_cable';
    var order = lesson === '2.2' ? ['no_router', 'line_off', 'missing_cable', 'wifi_range', 'broken_cable', 'wall_gap'] : FAULTS_21;
    var n = jobNo - 2 + (lesson === '2.2' ? 0 : 2);   // 2.1 already trained on the first two faults
    if (n < order.length) return order[n];
    var pool = lesson === '2.2' ? FAULTS_21.filter(function (f) { return f !== 'switch_full'; }).concat(FAULTS_22) : FAULTS_21;
    return pool[rnd(pool.length)];
  }
  function newGame(lesson, jobNo) {
    return { v: 1, lesson: lesson === '2.2' || lesson === '2.4' ? lesson : '2.1', jobNo: jobNo || 0, lastBusiness: '', seenCases: [], job: null, script: null, phase: 'loading',
      chats: {}, busy: {}, techCalls: 0, wrongOrders: 0, falseFixes: 0, jobStart: 0, score: null, opSeq: 0, version: 0 };
  }
  // A new job (phase loading until the customer's script is set).
  function beginJob(g, rnd) {
    var fault = faultFor(g.lesson, g.jobNo, rnd);
    var j = g.lesson === '2.4' ? makeSearchJob(rnd, fault, g.lastBusiness, g.seenCases) : makeJob(rnd, g.lesson, fault, g.lastBusiness);
    g.job = j; g.script = null; g.phase = 'loading'; g.chats = {}; g.busy = {}; g.techCalls = 0; g.wrongOrders = 0; g.falseFixes = 0; g.score = null; g.opSeq = 0;
    g.lastBusiness = j.business;
    return j;
  }
  function say(g, who, side, text) {
    var l = g.chats[who] || (g.chats[who] = []);
    l.push({ who: side, text: String(text) });
    if (l.length > 40) l.splice(0, l.length - 40);
  }
  function setScript(g, script, now) { g.script = script; g.phase = 'job'; g.jobStart = now; say(g, 'customer', 'them', script.opening); }
  function ask(g, q) {
    if (g.phase !== 'job' || !g.script) return '?';
    var label = null; questionsFor(g.lesson).forEach(function (x) { if (x.id === q) label = x.label; });
    if (!label || !g.script.answers[q]) return '?';
    say(g, 'customer', 'me', label); say(g, 'customer', 'them', g.script.answers[q]);
    return null;
  }
  // A change from the page, with its sequence number: applied once, in order (the shell skips what it already has).
  function applyGameOp(g, o) {
    if (g.phase !== 'job' || !g.job) return '?';
    return o && o.op === 'ask' ? ask(g, str(o.q, 20)) : applyOp(g.job, o);
  }
  function applyOps(g, ops) {
    var refused = [];
    (Array.isArray(ops) ? ops : []).forEach(function (o) {
      var seq = Math.floor(Number(o && o.seq));
      if (!(seq === g.opSeq + 1)) return;
      g.opSeq = seq;
      var why = applyGameOp(g, o); if (why) refused.push(why);
    });
    return refused;
  }
  function officeOk(g, who) { return g.phase === 'job' && !!g.job && officesFor(g.lesson).some(function (o) { return o.id === who; }); }
  // An office's (checked) reply: deliveries, the cable hole, the line.
  function officeReply(g, who, r) {
    var j = g.job;
    say(g, who, 'them', r.reply);
    Object.keys(r.send).forEach(function (k) {
      addStock(j, k, r.send[k]);
      if (!has(j.useful, k)) g.wrongOrders++;
      say(g, who, 'note', r.send[k] + ' x ' + kindName(k) + ' delivered to your desk.');
    });
    if (r.openHole && j.gaps.length && !has(j.openGaps, j.gaps[0])) { j.openGaps.push(j.gaps[0]); say(g, who, 'note', 'There is a cable hole in the wall now.'); }
    if (r.lineOn && !j.lineOn) { j.lineOn = true; say(g, who, 'note', 'The internet line into ' + j.business + ' is on.'); }
  }
  // "It is fixed. Please try it!": the game checks.
  function fixed(g) {
    if (g.phase !== 'job' || !g.job || !g.script || g.lesson === '2.4') return false;
    var probs = problems(g.job);
    say(g, 'customer', 'me', 'I think it is fixed now. Can you try it?');
    if (probs.length) { g.falseFixes++; say(g, 'customer', 'them', 'I just tried it. It is still not working. ' + probs[0]); return false; }
    g.phase = 'explain';
    say(g, 'customer', 'them', 'Yes! It works! Thank you. Can you tell me in one sentence what was wrong, so I understand?');
    return true;
  }
  // Lesson 2.4: the answer and the search terms.
  function tell(g, text) {
    text = str(text, 240).trim();
    if (!text || g.phase !== 'job' || !g.job || !g.job.caseId || !g.script) return false;
    say(g, 'customer', 'me', text);
    var r = tellCheck(g.job, text);
    if (!r.ok) { if (r.mistake) g.falseFixes++; say(g, 'customer', 'them', r.reply); return false; }
    g.phase = 'explain';
    say(g, 'customer', 'them', 'Yes! I typed it and the right page came first. Thank you! But why did my search not work? Can you tell me in one sentence?');
    return true;
  }
  // The points: 100, less a quarter for each Tech Lead call; 10 off for each wrong order and each "it is fixed" too soon;
  // 15 for each explanation mark; up to 20 for speed (full under 3 minutes, none after 10). At least 10.
  function points(techCalls, wrong, falseFixes, marks, mins) {
    var basePts = Math.round(100 * Math.pow(0.75, techCalls));
    var speed = Math.round(20 * Math.max(0, Math.min(1, (10 - mins) / 7)));
    return { total: Math.max(10, basePts - 10 * wrong - 10 * falseFixes + 15 * marks + speed), basePts: basePts, speed: speed };
  }
  function finish(g, marks, reply, now) {
    say(g, 'customer', 'them', reply);
    var mins = Math.max(0, (now - g.jobStart) / 60000), p = points(g.techCalls, g.wrongOrders, g.falseFixes, marks, mins);
    g.score = { total: p.total, basePts: p.basePts, tech: g.techCalls, wrong: g.wrongOrders, falseFixes: g.falseFixes, marks: marks, speed: p.speed, minutes: Math.round(mins * 10) / 10 };
    g.jobNo++; g.phase = 'scored';
    return g.score;
  }

  return {
    WIFI_RANGE: WIFI_RANGE, FAULTS_21: FAULTS_21, FAULTS_22: FAULTS_22, FAULTS_24: FAULTS_24, CASES: CASES, PLACES: PLACES,
    ports: ports, kindName: kindName, dev: dev, used: used, reach: reach, webOk: webOk, problems: problems, test: test, applyOp: applyOp,
    makeJob: makeJob, makeSearchJob: makeSearchJob, caseOf: caseOf, whyNotGood: whyNotGood, tellCheck: tellCheck, whyExample: whyExample,
    info: info, facts: facts, questionsFor: questionsFor, scriptFallback: scriptFallback, officesFor: officesFor, catalogue: catalogue,
    officeFallback: officeFallback, checkOffice: checkOffice, techFallback: techFallback, explainFallback: explainFallback, clean: clean,
    faultFor: faultFor, newGame: newGame, beginJob: beginJob, say: say, setScript: setScript, ask: ask, applyOps: applyOps,
    officeOk: officeOk, officeReply: officeReply, fixed: fixed, tell: tell, points: points, finish: finish
  };
})();
