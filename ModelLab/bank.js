// Model Lab bank (Year 8, 3.2 Data Requirements for Models): the models and applications every activity and the
// 3.2 drills use. No DOM here: tools/build_y8_3_2.mjs copies this file into the drill data files, so the lesson's
// drills and the app always use the same models, data items and rules.
//
// A model has a rule that uses some data items (`data`, each with a slot id and a range of values). `near` items
// sound like the right data but are old, or about something else: each stands in for one slot with a different
// value. `extra` items are things the rule never uses. A blank slot counts as 0, as a blank cell does.
var MLBANK = (function () {
  'use strict';
  function rand(n) { return Math.floor(Math.random() * n); }
  function between(a, b, step) { step = step || 1; return a + step * rand(Math.floor((b - a) / step) + 1); }
  function pick(list) { return list[rand(list.length)]; }
  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) { var j = rand(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }

  var MODELS = [
    { id: 'savings', name: 'Savings model', out: 'the money in the account at the end', unit: '',
      rule: 'Money at the end = money in the account today + money saved each week x number of weeks.',
      data: [{ slot: 'start', text: 'Money in the account today', min: 20, max: 200, step: 10 },
        { slot: 'weekly', text: 'Money saved each week', min: 5, max: 25, step: 5 },
        { slot: 'weeks', text: 'Number of weeks', min: 2, max: 8 }],
      near: [{ slot: 'start', text: 'Money in the account a year ago', why: 'The rule starts from the money today, not a year ago.' },
        { slot: 'weekly', text: 'Money a friend saves each week', why: 'The rule needs what this person saves, not a friend.' }],
      extra: ['The name of the bank', 'What you plan to buy with it', 'The colour of your money box', 'Your date of birth', 'How far away the bank is'],
      calc: function (v) { return v.start + v.weekly * v.weeks; },
      work: function (v) { return v.start + ' + ' + v.weekly + ' x ' + v.weeks; },
      blank: ['start', 'weekly', 'weeks'] },
    { id: 'rabbits', name: 'Rabbit model', out: 'the rabbits on the island at the end', unit: 'rabbits',
      rule: 'Each year, the number of rabbits doubles. Do this once for every year.',
      data: [{ slot: 'start', text: 'Rabbits on the island now', min: 5, max: 40, step: 5 },
        { slot: 'years', text: 'Number of years', min: 1, max: 4 }],
      near: [{ slot: 'start', text: 'Rabbits on a different island', why: 'The rule needs the rabbits on this island.' }],
      extra: ['The number of foxes on the island', 'The size of the island', 'Each rabbit\'s name', 'How much each rabbit weighs', 'The colour of the rabbits'],
      calc: function (v) { var r = v.start; for (var i = 0; i < v.years; i++) r = r * 2; return r; },
      work: function (v) { return v.start + (v.years ? ' doubled ' + v.years + ' time' + (v.years === 1 ? '' : 's') : ' doubled 0 times'); },
      blank: ['start', 'years'] },
    { id: 'queue', name: 'Traffic light model', out: 'the cars waiting at the end', unit: 'cars',
      rule: 'Each minute: cars waiting = cars waiting + cars that arrive - cars that go.',
      data: [{ slot: 'start', text: 'Cars waiting at 8 am', min: 1, max: 6 },
        { slot: 'arrive', text: 'Cars that arrive each minute after 8 am', min: 5, max: 9 },
        { slot: 'go', text: 'Cars the green light lets go each minute', min: 2, max: 4 },
        { slot: 'minutes', text: 'Number of minutes', min: 3, max: 6 }],
      near: [{ slot: 'arrive', text: 'Cars that arrive each minute at midnight', why: 'The rule needs the cars after 8 am. At midnight far fewer cars come.' }],
      extra: ['The colour of each car', 'Each driver\'s name', 'The speed limit on the next road', 'How many seats each car has', 'The name of the road'],
      calc: function (v) { var w = v.start; for (var m = 0; m < v.minutes; m++) w = Math.max(0, w + v.arrive - v.go); return w; },
      work: function (v) { return v.start + ' + (' + v.arrive + ' - ' + v.go + ') x ' + v.minutes; },
      blank: ['start', 'go', 'minutes'] },
    { id: 'fish', name: 'Fish pond model', out: 'the fish in the pond at the end', unit: 'fish',
      rule: 'Each year: fish = fish + young fish born - fish eaten by birds.',
      data: [{ slot: 'start', text: 'Fish in the pond now', min: 30, max: 60, step: 5 },
        { slot: 'born', text: 'Young fish born each year', min: 10, max: 30, step: 2 },
        { slot: 'eaten', text: 'Fish eaten by birds each year', min: 2, max: 6 },
        { slot: 'years', text: 'Number of years', min: 1, max: 4 }],
      near: [{ slot: 'born', text: 'Young fish born each year in the sea', why: 'The rule needs the young fish born in this pond.' }],
      extra: ['How deep the pond is', 'Each fish\'s name', 'The colour of the fish', 'The number of frogs in the pond', 'The name of the pond\'s owner'],
      calc: function (v) { var f = v.start; for (var y = 0; y < v.years; y++) f = Math.max(0, f + v.born - v.eaten); return f; },
      work: function (v) { return v.start + ' + (' + v.born + ' - ' + v.eaten + ') x ' + v.years; },
      blank: ['start', 'born', 'eaten', 'years'] },
    { id: 'flight', name: 'Flight simulator', out: 'the height of the plane at the end, in metres', unit: 'metres',
      rule: 'Height at the end = height now + climb speed x number of seconds.',
      data: [{ slot: 'start', text: 'Height of the plane now', min: 500, max: 2000, step: 100 },
        { slot: 'climb', text: 'Climb speed (metres each second)', min: 5, max: 20 },
        { slot: 'seconds', text: 'Number of seconds', min: 10, max: 60, step: 10 }],
      near: [{ slot: 'climb', text: 'Climb speed of a different plane', why: 'The rule needs how fast this plane climbs.' }],
      extra: ['The pilot\'s name', 'How many people are on board', 'The colour of the plane', 'The film on the seat screens', 'The name of the airport'],
      calc: function (v) { return v.start + v.climb * v.seconds; },
      work: function (v) { return v.start + ' + ' + v.climb + ' x ' + v.seconds; },
      blank: ['start', 'climb', 'seconds'] },
    { id: 'trip', name: 'School trip model', out: 'the cost of the trip, in baht', unit: 'baht',
      rule: 'Cost = price of the coach + price of one ticket x number of students going.',
      data: [{ slot: 'coach', text: 'Price of the coach', min: 2000, max: 5000, step: 500 },
        { slot: 'ticket', text: 'Price of one ticket', min: 100, max: 300, step: 50 },
        { slot: 'students', text: 'Number of students going', min: 20, max: 60, step: 5 }],
      near: [{ slot: 'ticket', text: 'Price of one ticket last year', why: 'The rule needs this year\'s price. Last year\'s may be different.' },
        { slot: 'students', text: 'Number of students in the whole school', why: 'Only the students going need a ticket.' }],
      extra: ['The weather on the trip day', 'The colour of the coach', 'The names of the students', 'What the students eat for lunch', 'How far away the trip is'],
      calc: function (v) { return v.coach + v.ticket * v.students; },
      work: function (v) { return v.coach + ' + ' + v.ticket + ' x ' + v.students; },
      blank: ['coach', 'ticket', 'students'] }
  ];
  function model(id) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i]; return null; }

  // Fresh values for every slot of a model, and a value for each near item that differs from the real one.
  function values(m) {
    var v = {};
    m.data.forEach(function (d) { v[d.slot] = between(d.min, d.max, d.step); });
    return v;
  }
  function nearValue(m, n, v) {
    var d = null;
    m.data.forEach(function (x) { if (x.slot === n.slot) d = x; });
    var out, guard = 0;
    do { out = between(d.min, d.max, d.step); guard++; } while ((out === v[n.slot] || m.calc(withSlot(v, n.slot, out)) === m.calc(v)) && guard < 50);
    // At midnight, last year, a different island: clearly different, so the prediction is clearly wrong.
    if (n.slot === 'students' && /whole school/.test(n.text)) out = between(400, 900, 50);
    if (n.slot === 'arrive') out = between(0, 2);
    if (n.slot === 'born' && /sea/.test(n.text)) out = between(200, 900, 100);
    return out;
  }
  function withSlot(v, slot, value) { var o = {}; for (var k in v) o[k] = v[k]; o[slot] = value; return o; }

  // The prediction a model makes from the data it is given: given[slot] is a value, or missing (counts as 0).
  function predict(m, given) {
    var v = {};
    m.data.forEach(function (d) { v[d.slot] = given[d.slot] == null ? 0 : given[d.slot]; });
    return m.calc(v);
  }

  // ---------------------------------------------------------------- applications (compare two of them)
  var APPS = {
    weather: { name: 'Weather app', job: 'the chance of rain tomorrow' },
    satnav: { name: 'Sat nav', job: 'the fastest way and the journey time' },
    flight: { name: 'Flight simulator', job: 'how the plane moves on the screen' },
    fitness: { name: 'Fitness app', job: 'the energy you used today' },
    savings: { name: 'Savings app', job: 'the money you will have next year' }
  };
  // Data items and the applications that use them. Pairs below only use items whose answer is clear for both.
  var ITEMS = {
    pressure: ['Air pressure now', ['weather']],
    wet: ['How wet the air is', ['weather']],
    temp: ['Temperature now', ['weather']],
    wind: ['Wind speed and direction', ['weather', 'flight']],
    here: ['Where you are now', ['weather', 'satnav']],
    dest: ['Where you want to go', ['satnav']],
    traffic: ['How fast the traffic is moving now', ['satnav']],
    closed: ['Roads that are closed today', ['satnav']],
    stick: ['The control stick position', ['flight']],
    engine: ['Engine power', ['flight']],
    planeWeight: ['The weight of the plane', ['flight']],
    steps: ['Steps walked today', ['fitness']],
    heart: ['Your heart rate', ['fitness']],
    bodyWeight: ['Your body weight', ['fitness']],
    money: ['Money in the account today', ['savings']],
    weekly: ['Money saved each week', ['savings']],
    bank: ['Extra money the bank adds each year', ['savings']],
    colour: ['Your favourite colour', []],
    photos: ['How many photos are on your phone', []],
    school: ['The name of your school', []],
    football: ['Last week\'s football scores', []],
    phonePrice: ['The price of your phone', []],
    song: ['Your favourite song', []]
  };
  // Each pair: [A, B, A-only items, B-only items, both, items that are clearly neither].
  var PAIRS = [
    ['weather', 'satnav', ['pressure', 'wet', 'temp'], ['dest', 'traffic', 'closed'], ['here'], ['steps', 'stick', 'money', 'colour', 'photos', 'football', 'phonePrice', 'song']],
    ['weather', 'flight', ['pressure', 'wet'], ['stick', 'engine', 'planeWeight'], ['wind'], ['steps', 'dest', 'money', 'colour', 'school', 'football', 'song']],
    ['satnav', 'fitness', ['dest', 'traffic', 'closed'], ['steps', 'heart', 'bodyWeight'], [], ['pressure', 'stick', 'money', 'colour', 'photos', 'school', 'phonePrice']],
    ['savings', 'fitness', ['money', 'weekly', 'bank'], ['steps', 'heart', 'bodyWeight'], [], ['pressure', 'traffic', 'stick', 'colour', 'photos', 'football', 'song']]
  ];
  // One round of a pair: 8 items, as [{id, text, where}] with where 'a', 'b', 'both' or 'neither'.
  function pairRound(pair) {
    var a = shuffle(pair[2]).slice(0, 2), b = shuffle(pair[3]).slice(0, 2), both = pair[4].slice(0, 1);
    var neither = shuffle(pair[5]).slice(0, 8 - a.length - b.length - both.length);
    var out = [];
    a.forEach(function (k) { out.push({ id: k, text: ITEMS[k][0], where: 'a' }); });
    b.forEach(function (k) { out.push({ id: k, text: ITEMS[k][0], where: 'b' }); });
    both.forEach(function (k) { out.push({ id: k, text: ITEMS[k][0], where: 'both' }); });
    neither.forEach(function (k) { out.push({ id: k, text: ITEMS[k][0], where: 'neither' }); });
    return shuffle(out);
  }

  // ---------------------------------------------------------------- briefs (design the data from what a user says)
  // No rule is shown: the brief says what the user wants and what changes it, in the user's words.
  var BRIEFS = [
    { id: 'canteen', who: 'The school cook', ask: 'How many school lunches should I cook today?', unit: 'lunches',
      says: 'Every student on the register eats a school lunch, except students who are absent today, students on today\'s trip and students who bring a packed lunch.',
      data: [{ slot: 'register', text: 'Students on the register', min: 380, max: 460, step: 2 },
        { slot: 'absent', text: 'Students absent today', min: 8, max: 25 },
        { slot: 'trip', text: 'Students on today\'s trip', min: 20, max: 60, step: 2 },
        { slot: 'packed', text: 'Students with a packed lunch today', min: 20, max: 50 }],
      near: [{ slot: 'absent', text: 'Students absent last Monday', why: 'Different students are absent each day. The cook needs today.' },
        { slot: 'packed', text: 'Students with a packed lunch last term', why: 'That is old data. The cook needs the packed lunches today.' }],
      extra: ['Each student\'s name', 'The price of one lunch', 'Today\'s menu', 'How many cooks work today', 'Lunches cooked yesterday'],
      calc: function (v) { return Math.max(0, v.register - v.absent - v.trip - v.packed); },
      work: function (v) { return v.register + ' - ' + v.absent + ' - ' + v.trip + ' - ' + v.packed; } },
    { id: 'bus', who: 'A student', ask: 'How many minutes after it leaves the station will the bus reach my stop?', unit: 'minutes',
      says: 'The bus stops for 1 minute at each stop before mine. The rest of the time depends on how far away my stop is and how slow the traffic is today.',
      data: [{ slot: 'km', text: 'Distance from the station to my stop (km)', min: 3, max: 8 },
        { slot: 'perKm', text: 'Minutes the bus takes for each km today', min: 2, max: 4 },
        { slot: 'stops', text: 'Number of stops before mine', min: 3, max: 8 }],
      near: [{ slot: 'perKm', text: 'Minutes the bus took for each km on Sunday', why: 'Traffic on Sunday is not the traffic today.' },
        { slot: 'km', text: 'Distance from the station to the next town', why: 'The rule needs the distance to this stop.' }],
      extra: ['The driver\'s name', 'How many seats the bus has', 'The colour of the bus', 'The price of a ticket', 'How many people get on at each stop'],
      calc: function (v) { return v.km * v.perKm + v.stops; },
      work: function (v) { return v.km + ' x ' + v.perKm + ' + ' + v.stops + ' x 1'; } },
    { id: 'icecream', who: 'The fair team', ask: 'How many cups of ice cream should we bring to the school fair?', unit: 'cups',
      says: 'About 1 in every 4 visitors buys a cup. If it is over 30 degrees on the day of the fair, it is 1 in every 2.',
      data: [{ slot: 'visitors', text: 'Visitors expected at the fair', min: 200, max: 600, step: 40 },
        { slot: 'temp', text: 'Temperature forecast for the fair day', min: 26, max: 36 }],
      near: [{ slot: 'temp', text: 'Temperature today', why: 'The fair is on another day. Today\'s weather is not the fair\'s weather.' },
        { slot: 'visitors', text: 'Visitors at last year\'s sports day', why: 'That is a different event in a different year.' }],
      extra: ['The flavours we will sell', 'The price of one cup', 'The names of the helpers', 'How big the freezer is', 'How many spoons we have', 'The colour of the cups'],
      calc: function (v) { return v.temp > 30 ? v.visitors / 2 : v.visitors / 4; },
      work: function (v) { return v.visitors + (v.temp > 30 ? ' / 2 (over 30 degrees)' : ' / 4 (not over 30 degrees)'); } },
    { id: 'battery', who: 'A student', ask: 'How much battery will my phone have left when the coach trip ends?', unit: '%',
      says: 'I watch videos for the whole coach trip. Every hour of video uses the same amount of battery.',
      data: [{ slot: 'now', text: 'Battery left now (%)', min: 70, max: 100, step: 5 },
        { slot: 'use', text: 'Battery one hour of video uses (%)', min: 10, max: 20, step: 5 },
        { slot: 'hours', text: 'Hours the coach trip takes', min: 1, max: 3 }],
      near: [{ slot: 'use', text: 'Battery one hour of video used when the phone was new', why: 'An old battery runs down faster than a new one.' },
        { slot: 'hours', text: 'Hours last year\'s trip took', why: 'This trip may be longer or shorter.' }],
      extra: ['The colour of the phone', 'The name of the video', 'How many apps are on the phone', 'How big the screen is', 'The price of the phone'],
      calc: function (v) { return Math.max(0, v.now - v.use * v.hours); },
      work: function (v) { return v.now + ' - ' + v.use + ' x ' + v.hours; } }
  ];
  function briefNear(b, n, v) {
    var d = null;
    b.data.forEach(function (x) { if (x.slot === n.slot) d = x; });
    var out, guard = 0;
    do { out = between(d.min, d.max, d.step); guard++; } while ((out === v[n.slot] || b.calc(withSlot(v, n.slot, out)) === b.calc(v)) && guard < 80);
    if (n.slot === 'km') out = between(15, 30);
    if (n.slot === 'temp') out = v.temp > 30 ? between(26, 30) : between(31, 36);
    return out;
  }


  // ---------------------------------------------------------------- what if: one change to one model
  // level 0: any change, answer higher, lower or the same; level 1: a change to data the rule uses, answer the new
  // number. strong(text) marks the data item in the sentence (the app makes it bold).
  var NO_TYPO = ['years', 'minutes', 'weeks', 'seconds', 'go', 'eaten'];
  var NO_DOUBLE = ['years', 'go', 'eaten'];
  function dataOf(m, slot) { return m.data.filter(function (d) { return d.slot === slot; })[0]; }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function whatIf(level, lastId, strong) {
    strong = strong || function (s) { return s; };
    for (var guard = 0; guard < 300; guard++) {
      var m = pick(MODELS.filter(function (x) { return x.id !== lastId; })), v = values(m), old = m.calc(v), nv = withSlot(v, '', 0), d, n, text, changed = null;
      delete nv[''];
      var kind = pick(level === 0 ? ['blank', 'blank', 'typo', 'near', 'double', 'extra-add', 'extra-gone', 'extra-add'] : ['blank', 'blank', 'typo', 'double']);
      if (kind === 'blank') {
        d = dataOf(m, pick(m.blank)); nv[d.slot] = 0; changed = d.slot;
        text = strong(d.text) + ' is left blank. A blank counts as 0.';
      } else if (kind === 'typo') {
        var ok = m.data.filter(function (x) { return NO_TYPO.indexOf(x.slot) < 0; });
        d = pick(ok); nv[d.slot] = v[d.slot] * 10; changed = d.slot;
        text = 'Someone types ' + strong(lower(d.text)) + ' as ' + nv[d.slot] + ' by mistake. The real value is ' + v[d.slot] + '.';
      } else if (kind === 'double') {
        d = pick(m.data.filter(function (x) { return NO_DOUBLE.indexOf(x.slot) < 0; })); nv[d.slot] = v[d.slot] * 2; changed = d.slot;
        text = 'New data comes in: ' + strong(lower(d.text)) + ' is now ' + nv[d.slot] + ', twice as much as before.';
      } else if (kind === 'near') {
        n = pick(m.near); d = dataOf(m, n.slot); nv[d.slot] = nearValue(m, n, v); changed = d.slot;
        text = 'Someone types in ' + strong(lower(n.text)) + ' (' + nv[d.slot] + ') instead of ' + lower(d.text) + ' (' + v[d.slot] + ').';
      } else {
        var ex = pick(m.extra);
        text = kind === 'extra-add' ? 'Someone adds one more data item to the model: ' + strong(ex) + '.' : 'The model is never told ' + strong(lower(ex)) + '.';
      }
      var now = m.calc(nv);
      if (kind.indexOf('extra') < 0 && now === old) continue;
      if (now < 0 || now > 99999 || now !== Math.round(now)) continue;
      var why = kind === 'blank' ? 'The rule uses ' + lower(d.text) + '. With 0 there, the rule works out a different answer.'
        : kind === 'typo' ? 'The rule only knows the number it is given. Wrong data in gives a wrong prediction out.'
        : kind === 'double' ? 'The rule uses ' + lower(d.text) + ', so new data changes the prediction.'
        : kind === 'near' ? n.why + ' The rule gets a different number, so the prediction is wrong.'
        : 'The rule never uses it, so the prediction does not change.';
      return { m: m, v: v, nv: nv, old: old, now: now, kind: kind, text: text, changed: changed, near: n, why: why,
        dir: now > old ? 'higher' : now < old ? 'lower' : 'same' };
    }
    throw new Error('no what-if round');
  }

  return { whatIf: whatIf, dataOf: dataOf, lower: lower, rand: rand, between: between, pick: pick, shuffle: shuffle, MODELS: MODELS, model: model, values: values,
    nearValue: nearValue, withSlot: withSlot, predict: predict, APPS: APPS, ITEMS: ITEMS, PAIRS: PAIRS, pairRound: pairRound,
    BRIEFS: BRIEFS, briefNear: briefNear };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MLBANK;
