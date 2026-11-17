// Circuit Siege rules and balance data. Pure data, no DOM, so the node balance test can load it too.
// Units follow the balance reference: the logic runs in frames of 1/35 s, speeds are pixels per frame,
// rates are frames between shots, ranges are pixels. The board is 960 x 540, the same height as the
// reference play area, so pixels map 1 to 1.
(function (root) {
  'use strict';
  var FPS = 35;
  var W = 960, H = 540;

  // Our own circuit track: 16 turns, about 2165 px long (reference first track: 2137 px, 16 turns).
  var PATH = [[-30, 80], [150, 80], [150, 190], [60, 190], [60, 320], [250, 320], [250, 170], [370, 170], [370, 70],
    [540, 70], [540, 240], [470, 240], [470, 380], [650, 380], [650, 230], [720, 230], [720, 330], [765, 330]];
  var CPU = { x: 805, y: 330, s: 70 };
  var TRACK = 34;
  // Coolant channels: the only places a Coolant Turret can go.
  var WATER = [{ x: 30, y: 440, w: 600, h: 60 }, { x: 872, y: 20, w: 64, h: 500 }];

  // ---------------------------------------------------------------- enemies (reference rank order 1..14)
  // spd px/frame, rbe = lives lost if it escapes, kids = what it splits into, hits = hits to break this layer.
  var ENEMIES = {
    glitch: { rank: 1, name: 'Glitch', spd: 2, rbe: 1, kids: [], r: 9, first: 1, tip: 'Glitch: the weakest bug. One hit removes it.' },
    bug: { rank: 2, name: 'Bug', spd: 2.8, rbe: 2, kids: ['glitch'], r: 10, first: 3, tip: 'Bug: one hit turns it into a Glitch.' },
    worm: { rank: 3, name: 'Worm', spd: 3.6, rbe: 3, kids: ['bug'], r: 10.5, first: 6, tip: 'Worm: faster. One hit turns it into a Bug.' },
    spam: { rank: 4, name: 'Spambot', spd: 6.4, rbe: 4, kids: ['worm'], r: 11, first: 11, tip: 'Spambot: very fast. One hit turns it into a Worm.' },
    popup: { rank: 5, name: 'Pop-up', spd: 7, rbe: 5, kids: ['spam'], r: 11.5, first: 15, tip: 'Pop-up: the fastest bug. One hit turns it into a Spambot.' },
    trojan: { rank: 6, name: 'Trojan', spd: 3.6, rbe: 11, kids: ['popup', 'popup'], r: 8, first: 20, noBlast: true, tip: 'Trojan: blasts cannot hurt it. Use sharp shots.' },
    fever: { rank: 7, name: 'Heat Virus', spd: 4, rbe: 11, kids: ['popup', 'popup'], r: 8, first: 22, noFreeze: true, tip: 'Heat Virus: cold cannot freeze it.' },
    packet: { rank: 8, name: 'Encrypted Packet', spd: 2, rbe: 23, kids: ['trojan', 'trojan'], r: 12, first: 28, lead: true, tip: 'Encrypted Packet: sharp shots bounce off. Use blasts or fire.' },
    hybrid: { rank: 9, name: 'Hybrid Virus', spd: 3.6, rbe: 23, kids: ['trojan', 'fever'], r: 12, first: 25, noBlast: true, noFreeze: true, tip: 'Hybrid Virus: no blasts and no cold. Use sharp shots.' },
    poly: { rank: 10, name: 'Polymorph', spd: 4.4, rbe: 47, kids: ['hybrid', 'hybrid'], r: 13, first: 35, tip: 'Polymorph: fast. Splits into two Hybrid Viruses.' },
    rootkit: { rank: 11, name: 'Rootkit', spd: 2.8, rbe: 9, kids: ['popup', 'popup'], r: 11, first: 24, camo: true, tip: 'Rootkit: hidden. Towers need a scanner nearby to see it.' },
    ransom: { rank: 12, name: 'Ransomware', spd: 4, rbe: 103, kids: ['poly', 'poly'], r: 13, first: 40, hits: 9, noGlue: true, tip: 'Ransomware: takes 9 hits, then splits into two Polymorphs.' },
    botnet: { rank: 13, name: 'Botnet Carrier', spd: 2, rbe: 613, kids: ['ransom', 'ransom', 'ransom', 'ransom'], r: 30, first: 46, hits: 200, zep: true, noGlue: true, noFreeze: true, tip: 'Botnet Carrier: huge. 200 hits, then 4 Ransomware come out.' },
    mega: { rank: 14, name: 'Mega Botnet', spd: 0.5, rbe: 2884, kids: ['botnet', 'botnet', 'botnet', 'botnet'], r: 42, first: 60, hits: 700, zep: true, noGlue: true, noFreeze: true, tip: 'Mega Botnet: very slow, 700 hits, 4 Botnet Carriers inside.' }
  };
  var ENEMY_KEYS = Object.keys(ENEMIES);

  // ---------------------------------------------------------------- waves
  // Each round: the reference RBE and which kinds of enemy belong in it. Our own mixer (below) picks the
  // counts and the spawn order, so the RBE matches and every kind first appears in the reference round.
  var LETTER = { g: 'glitch', b: 'bug', w: 'worm', s: 'spam', p: 'popup', t: 'trojan', f: 'fever', k: 'packet', h: 'hybrid', y: 'poly', r: 'rootkit', x: 'ransom', m: 'botnet', M: 'mega' };
  var ROUND_SPEC = ('14:g 30:g 30:gb 60:gb 45:gb 57:gbw 85:gbw 101:gbw 79:gbw 200:b 69:gbws 80:bws 135:gws 150:gbws 120:gwsp ' +
    '137:wsp 182:wsp 240:w 125:wsp 88:t 80:p 99:f 121:tf 9:r 138:h 167:sptf 400:s 230:kh 350:p 230:k 414:h 789:tfk 450:r 322:h ' +
    '826:pfy 450:p 1130:tfkh 1612:fkhy 2174:tfkhy 902:gyx 1760:tf 2330:ky 1500:yx 1765:fhx 2359:pky 613:m 2690:rx 3430:yr ' +
    '3908:hyrx 3490:gkxm 3354:yx 3431:yxm 2913:grm 4831:xm 4726:kyxm 8828:yxm 5877:yxm 5074:yxm 5150:x 2884:M 4970:yx 3026:rm ' +
    '6575:kyx 4291:m 7936:hyxm 5517:m 7703:gxm 5350:gmM 10990:kx 11239:ym 9220:xm 5798:gM 7219:gmM 23484:xM 11762:gkmM').split(' ');
  var RBE = [0], INGR = [[]];
  ROUND_SPEC.forEach(function (s) {
    var p = s.split(':');
    RBE.push(Number(p[0]));
    INGR.push(p[1].split('').map(function (c) { return LETTER[c]; }));
  });
  var SPECIAL = { rootkit: 1, packet: 1, botnet: 1, mega: 1 };

  function roundMix(n) {
    var T = RBE[n], ing = INGR[n].slice().sort(function (a, b) { return ENEMIES[b].rbe - ENEMIES[a].rbe; });
    var top = ENEMIES[ing[0]].rbe, frac = ing.length === 1 ? 0.85 : 1;
    var wsum = 0, cnt = {}, used = 0;
    function wt(k) { return Math.pow(ENEMIES[k].rbe, ENEMIES[k].zep ? 0.4 : 0.7); }
    ing.forEach(function (k) { wsum += wt(k); });
    ing.forEach(function (k) {
      var e = ENEMIES[k];
      cnt[k] = Math.max(1, Math.floor(T * frac * wt(k) / wsum / e.rbe));
      used += cnt[k] * e.rbe;
    });
    while (used > T) {
      var big = null;
      ing.forEach(function (k) { if (cnt[k] > 1 && (!big || cnt[k] * ENEMIES[k].rbe > cnt[big] * ENEMIES[big].rbe)) big = k; });
      cnt[big]--; used -= ENEMIES[big].rbe;
    }
    // Fill what is left: ingredients first, then any ordinary kind that is already out and no stronger than the top kind.
    var fill = ing.slice();
    ENEMY_KEYS.forEach(function (k) {
      var e = ENEMIES[k];
      if (!SPECIAL[k] && e.first <= n && e.rbe <= top && fill.indexOf(k) < 0) fill.push(k);
    });
    fill.sort(function (a, b) { return ENEMIES[b].rbe - ENEMIES[a].rbe; });
    var rem = T - used;
    fill.forEach(function (k) {
      var c = Math.floor(rem / ENEMIES[k].rbe);
      if (c > 0) { cnt[k] = (cnt[k] || 0) + c; rem -= c * ENEMIES[k].rbe; }
    });
    return cnt;
  }

  // Spawn order: each kind is cut into chunks, then chunks are dealt weakest to strongest, pass after pass.
  function buildRound(n) {
    var cnt = roundMix(n), keys = Object.keys(cnt).sort(function (a, b) { return ENEMIES[a].rbe - ENEMIES[b].rbe; });
    var left = {}, chunk = {}, out = [];
    keys.forEach(function (k) { left[k] = cnt[k]; chunk[k] = ENEMIES[k].zep ? 1 : Math.max(1, Math.ceil(cnt[k] / (3 + (n % 3)))); });
    var any = true;
    while (any) {
      any = false;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], c = Math.min(left[k], chunk[k]);
        for (var j = 0; j < c; j++) out.push(k);
        left[k] -= c; if (left[k] > 0) any = true;
      }
    }
    return out;
  }
  function spawnGap(n) { var g = 20 - Math.floor(n / 3); return g < 7 ? Math.ceil(7 - n / 20) : g; }

  // ---------------------------------------------------------------- difficulty and money
  var DIFF = {
    easy: { name: 'Easy', rounds: 50, lives: 200, price: 0.85, speed: 0, bonus: 1.2, line: '50 waves. 200 lives. Lower prices. Marks pay 20% extra.' },
    medium: { name: 'Medium', rounds: 60, lives: 150, price: 1, speed: 0.1, bonus: 1.1, line: '60 waves. 150 lives. Marks pay 10% extra.' },
    hard: { name: 'Hard', rounds: 75, lives: 100, price: 1.08, speed: 0.25, bonus: 1, line: '75 waves. 100 lives. Faster bugs. Higher prices.' }
  };
  var START_CASH = 650, SELL = 0.8;
  function price(base, diff) { return Math.round(base * DIFF[diff].price / 5) * 5; }
  function speedBonus(n, diff) { return DIFF[diff].speed + (n > 50 ? (n - 50) / 15 : 0); }
  function popShare(n) { return n <= 50 ? 1 : n < 60 ? 1 / 3 : 1 / 5; }
  // Coins the reference player would have earned for round n: pops + end-of-round bonus + server farm income.
  function roundPool(n, diff, income) {
    return Math.round((RBE[n] * popShare(n) + 99 + n + (income || 0)) * DIFF[diff].bonus);
  }

  // ---------------------------------------------------------------- towers
  // Base numbers are the reference numbers. Fields: rate (frames), range (px), pierce, spd (projectile px/frame),
  // rad (projectile hit radius). Flags: lead = can break Encrypted Packets, ice = can hit frozen bugs, blast = explosion radius.
  var TOWERS = {
    pulse: { name: 'Pulse Node', cost: 200, kind: 'shot', look: 'dart', blurb: 'Fires one fast pulse at a bug.',
      base: { rate: 33, range: 100, pierce: 1, spd: 23, rad: 4 },
      up: [
        { name: 'Twin Pierce', cost: 140, line: 'Each pulse hits 2 bugs.', fx: function (s) { s.pierce = 2; } },
        { name: 'Long Reach', cost: 90, line: 'Range 100 to 125.', fx: function (s) { s.range = 125; } },
        { name: 'Spike Ball', cost: 300, line: 'Fires heavy spike balls that hit 18 bugs.', fx: function (s) { s.rate = 54; s.range = 130; s.pierce = 18; s.spd = 11; s.rad = 9; s.look = 'ball'; } },
        { name: 'Triple Spike', cost: 1100, line: 'Fires 3 bigger spike balls at once.', fx: function (s) { s.n = 3; s.spread = 0.25; s.rate -= 5; s.range += 25; s.pierce += 30; s.rad = 13; s.spd += 5; } }
      ] },
    spark: { name: 'Spark Ring', cost: 360, kind: 'ring', look: 'tack', blurb: 'Shoots 8 sparks all around it.',
      base: { rate: 58, range: 70, pierce: 1, spd: 10, rad: 4, n: 8 },
      up: [
        { name: 'Quick Fire', cost: 210, line: 'Fires faster.', fx: function (s) { s.rate = 43; } },
        { name: 'Long Sparks', cost: 100, line: 'Range 70 to 80. Faster sparks.', fx: function (s) { s.range = 80; s.spd += 2; } },
        { name: 'Blade Discs', cost: 280, line: 'Big blades. Fires a bit faster.', fx: function (s) { s.rad = 10; s.rate -= 5; s.look = 'blade'; } },
        { name: 'Fire Ring', cost: 2500, line: 'A ring of fire hits every bug near it, even Encrypted Packets.', fx: function (s) { s.rate -= 12; s.range += 10; s.fire = true; s.lead = true; s.ice = true; s.pierce = 100; } }
      ] },
    router: { name: 'Bounce Router', cost: 400, kind: 'boomer', look: 'boomer', blurb: 'Throws a blade that curves back.',
      base: { rate: 50, range: 130, pierce: 3, spd: 9, rad: 7 },
      up: [
        { name: 'Multi Hit', cost: 250, line: 'Each blade hits 7 bugs.', fx: function (s) { s.pierce = 7; } },
        { name: 'Shock Wave', cost: 100, line: 'Blades can hit frozen bugs.', fx: function (s) { s.ice = true; } },
        { name: 'Glaive Router', cost: 280, line: 'Hits 12 bugs. Bigger and faster.', fx: function (s) { s.pierce += 5; s.rad = 10; s.rate -= 3; } },
        { name: 'Plasma Blade', cost: 1850, line: 'Hits 70 bugs and cuts Encrypted Packets.', fx: function (s) { s.pierce += 58; s.lead = true; s.rad = 14; s.look = 'plasma'; } }
      ] },
    surge: { name: 'Surge Capacitor', cost: 700, kind: 'shot', look: 'bomb', blurb: 'Fires a charge that blasts a group.',
      base: { rate: 54, range: 120, pierce: 18, spd: 12, rad: 6, blast: 28, lead: true, ice: true },
      up: [
        { name: 'Big Charge', cost: 400, line: 'Bigger blast. Hits 28 bugs.', fx: function (s) { s.blast *= 1.5; s.pierce += 10; } },
        { name: 'Long Range', cost: 200, line: 'Range 120 to 140.', fx: function (s) { s.range = 140; } },
        { name: 'Rocket Charge', cost: 210, line: 'Fast rockets. Fires faster.', fx: function (s) { s.spd = 25; s.rate -= 8; s.range += 5; s.pierce += 5; } },
        { name: 'Botnet Breaker', cost: 900, line: 'Hits Botnets 11 times as hard.', fx: function (s) { s.rate -= 5; s.pierce += 5; s.blast *= 1.2; s.moab = 10; } }
      ] },
    pins: { name: 'Pin Strip', cost: 30, kind: 'item', place: 'track', blurb: 'Put on the track. Breaks 10 bugs.', base: { pierce: 10 }, up: [] },
    cryo: { name: 'Cryo Fan', cost: 380, kind: 'freeze', look: 'fan', blurb: 'Freezes bugs near it for a moment.',
      base: { rate: 85, range: 60, pierce: 40, freeze: 50 },
      up: [
        { name: 'Deep Freeze', cost: 225, line: 'Freezes longer. Range 60 to 75.', fx: function (s) { s.freeze = 70; s.range += 15; } },
        { name: 'Lasting Chill', cost: 100, line: 'Bugs stay slow after they thaw.', fx: function (s) { s.chill = true; } },
        { name: 'Shatter Freeze', cost: 400, line: 'Freezing also breaks one layer.', fx: function (s) { s.snap = true; } },
        { name: 'Arctic Blast', cost: 6000, line: 'Every bug near it moves at one third speed.', fx: function (s) { s.range += 30; s.arctic = true; } }
      ] },
    mortar: { name: 'Uplink Mortar', cost: 825, kind: 'mortar', look: 'mortar', blurb: 'Strikes the spot you choose, anywhere.',
      base: { rate: 80, range: 9999, pierce: 40, blast: 80, scatter: 50, lead: true, ice: true, delay: 30 },
      up: [
        { name: 'Tight Aim', cost: 200, line: 'Lands closer to your spot.', fx: function (s) { s.scatter = 30; } },
        { name: 'Fast Reload', cost: 250, line: 'Fires faster.', fx: function (s) { s.rate = 60; } },
        { name: 'Layer Stripper', cost: 800, line: 'Each blast breaks 2 layers.', fx: function (s) { s.layers = 2; } },
        { name: 'Triple Battery', cost: 2000, line: 'Fires 3 times as fast.', fx: function (s) { s.rate = s.rate / 3; } }
      ] },
    fuse: { name: 'Fuse Charge', cost: 25, kind: 'item', place: 'track', blurb: 'Put on the track. Explodes after 3 seconds.', base: { pierce: 40, blast: 60, delay: 105 }, up: [] },
    lag: { name: 'Lag Gun', cost: 300, kind: 'shot', look: 'glue', blurb: 'Fires lag that slows a bug to one third speed.',
      base: { rate: 35, range: 140, pierce: 1, spd: 14, rad: 5, glue: 400 },
      up: [
        { name: 'Long Lag', cost: 120, line: 'Lag lasts twice as long.', fx: function (s) { s.glue += 400; } },
        { name: 'Deep Lag', cost: 200, line: 'Lag stays on every layer.', fx: function (s) { s.soak = true; } },
        { name: 'Corrupt Lag', cost: 300, line: 'Lagged bugs lose a layer every 2 seconds.', fx: function (s) { s.corrode = 80; } },
        { name: 'Lag Splash', cost: 3000, line: 'Lag splashes on up to 20 bugs.', fx: function (s) { s.pierce = 20; s.blast = 45; } }
      ] },
    booster: { name: 'Wi-Fi Booster', cost: 1000, kind: 'aura', look: 'wifi', blurb: 'Towers near it get more range.',
      base: { range: 120, auraRange: 1.2 },
      up: [
        { name: 'Wide Signal', cost: 500, line: 'Range 120 to 150.', fx: function (s) { s.range = 150; } },
        { name: 'Overclock', cost: 1500, line: 'Towers near it fire 15% faster.', fx: function (s) { s.auraRate = 1.15; } },
        { name: 'Stealth Scanner', cost: 280, line: 'Towers near it can see Rootkits.', fx: function (s) { s.auraCamo = true; } },
        { name: 'Core Storm', cost: 3500, line: 'Adds a Storm button: 1000 coins wipes out all small bugs.', fx: function (s) { s.storm = true; } }
      ] },
    patch: { name: 'Lag Patch', cost: 10, kind: 'item', place: 'track', blurb: 'Put on the track. Slows the next 20 bugs.', base: { pierce: 20, glue: 400 }, up: [] },
    drone: { name: 'Patrol Drone', cost: 900, kind: 'drone', look: 'drone', blurb: 'Flies in a loop and fires 8 darts all around.',
      base: { rate: 80, range: 250, pierce: 10, spd: 12, rad: 4, n: 8 },
      up: [
        { name: 'Fuse Drop', cost: 200, line: 'Also drops a Fuse Charge each time.', fx: function (s) { s.bombs = true; } },
        { name: 'Scout Mode', cost: 350, line: 'Towers near the drone can see Rootkits.', fx: function (s) { s.auraCamo = true; } },
        { name: 'Rapid Fire', cost: 700, line: 'Fires faster.', fx: function (s) { s.rate = 50; } },
        { name: 'Dart Storm', cost: 3500, line: 'Fires 16 darts much faster.', fx: function (s) { s.rate = 35; s.n = 16; } }
      ] },
    hydro: { name: 'Coolant Turret', cost: 600, kind: 'shot', look: 'hydro', place: 'water', blurb: 'Only in coolant. Long range heavy shots.',
      base: { rate: 35, range: 180, pierce: 5, spd: 15, rad: 5 },
      up: [
        { name: 'Scatter Shot', cost: 300, line: 'Adds 4 small shots each time.', fx: function (s) { s.grape = 4; } },
        { name: 'Sonar Mast', cost: 150, line: 'Towers near it can see Rootkits.', fx: function (s) { s.auraCamo = true; } },
        { name: 'Long Barrel', cost: 180, line: 'Range 180 to 210.', fx: function (s) { s.range = 210; } },
        { name: 'Battle Turret', cost: 2000, line: 'Fires 3.5 times as fast. Double hits.', fx: function (s) { s.rate = 10; s.pierce *= 2; } }
      ] },
    aicore: { name: 'AI Core', cost: 550, kind: 'shot', look: 'orb', blurb: 'Fires energy orbs. Learns new spells.',
      base: { rate: 38, range: 120, pierce: 2, spd: 13, rad: 5 },
      up: [
        { name: 'Strong Signal', cost: 300, line: 'Bigger orbs that hit 7 bugs.', fx: function (s) { s.pierce += 5; s.rad = 8; } },
        { name: 'Fire Packet', cost: 300, line: 'Sometimes fires a blast that melts Encrypted Packets.', fx: function (s) { s.pierce += 5; s.fireball = true; } },
        { name: 'Rollback', cost: 2000, line: 'Sometimes sends bugs back up the track.', fx: function (s) { s.pierce += 30; s.tornado = true; } },
        { name: 'Mega Rollback', cost: 8000, line: 'Huge rollbacks that also break a layer.', fx: function (s) { s.pierce += 125; s.rate -= 5; s.tempest = true; } }
      ] },
    quantum: { name: 'Quantum Core', cost: 4000, kind: 'shot', look: 'dart', blurb: 'Fires 17 shots every second.',
      base: { rate: 2, range: 140, pierce: 1, spd: 23, rad: 4 },
      up: [
        { name: 'Wide Scan', cost: 1000, line: 'Range 140 to 200.', fx: function (s) { s.range = 200; } },
        { name: 'Laser Eyes', cost: 3500, line: 'Lasers hit 2 bugs and frozen bugs.', fx: function (s) { s.pierce = 2; s.ice = true; s.look = 'laser'; } },
        { name: 'Plasma Eyes', cost: 4000, line: 'Twice as fast. Hits 3 bugs and Encrypted Packets.', fx: function (s) { s.pierce = 3; s.rate = 1; s.lead = true; s.look = 'plasma'; } },
        { name: 'Star Core', cost: 20000, line: 'Huge beams that hit 13 bugs.', fx: function (s) { s.pierce += 10; s.rad = 9; s.look = 'sun'; } }
      ] },
    farm: { name: 'Server Farm', cost: 1000, kind: 'farm', look: 'farm', blurb: 'Adds 80 coins to every exam round.',
      base: { range: 20, income: 80 },
      up: [
        { name: 'More Servers', cost: 400, line: 'Adds 120 coins each round.', fx: function (s) { s.income = 120; } },
        { name: 'Server Hall', cost: 1200, line: 'Adds 250 coins each round.', fx: function (s) { s.income = 250; } },
        { name: 'Data Centre', cost: 2500, line: 'Adds 500 coins each round.', fx: function (s) { s.income = 500; } },
        { name: 'Cloud Campus', cost: 10000, line: 'Adds 2000 coins each round.', fx: function (s) { s.income = 2000; } }
      ] },
    cursor: { name: 'Cursor Cannon', cost: 1250, kind: 'cursor', look: 'dart', blurb: 'Fires nonstop at your mouse pointer.',
      base: { rate: 7, range: 40, pierce: 2, spd: 20, rad: 4, scatter: 0.45 },
      up: [
        { name: 'Steady Barrel', cost: 250, line: 'Shots spread less.', fx: function (s) { s.scatter = 0.2; } },
        { name: 'Power Shots', cost: 600, line: 'Faster shots that hit 3 bugs.', fx: function (s) { s.spd = 35; s.pierce = 3; } },
        { name: 'Spin Up', cost: 2500, line: 'Fires more than 3 times as fast.', fx: function (s) { s.rate = 2; } },
        { name: 'Laser Cannon', cost: 15000, line: 'A laser that hits 16 bugs, even Encrypted Packets.', fx: function (s) { s.pierce += 13; s.lead = true; s.ice = true; s.look = 'laser'; } }
      ] },
    printer: { name: 'Pin Printer', cost: 700, kind: 'printer', look: 'printer', blurb: 'Prints Pin Strips onto the track near it.',
      base: { rate: 80, range: 120, pierce: 5, scatter: 0.15 },
      up: [
        { name: 'Fast Print', cost: 700, line: 'Prints faster.', fx: function (s) { s.rate = 50; } },
        { name: 'Big Strips', cost: 600, line: 'Each strip breaks 10 bugs.', fx: function (s) { s.pierce = 10; } },
        { name: 'Hot Pins', cost: 350, line: 'Pins break Encrypted Packets and frozen bugs.', fx: function (s) { s.lead = true; s.ice = true; } },
        { name: 'Pin Storm', cost: 7000, line: 'Every 14 seconds pins cover the whole track.', fx: function (s) { s.storm = 500; } }
      ] }
  };
  // Unlock order = reference rank order. Towers first, then the level 4 upgrades.
  var TOWER_ORDER = ['pulse', 'spark', 'router', 'surge', 'pins', 'cryo', 'mortar', 'fuse', 'lag', 'booster', 'patch', 'drone', 'hydro', 'aicore', 'quantum', 'farm', 'cursor', 'printer'];
  var TIER4_ORDER = ['surge', 'booster', 'pulse', 'router', 'hydro', 'spark', 'mortar', 'cryo', 'lag', 'drone', 'farm', 'aicore', 'quantum', 'cursor', 'printer'];

  // Towers unlock over the first 45% of the waves, level 4 upgrades over the next 45%.
  function unlockRound(key, diff, tier4) {
    var N = DIFF[diff].rounds;
    if (!tier4) {
      var i = TOWER_ORDER.indexOf(key);
      return 1 + Math.round(i * (Math.round(N * 0.45) - 1) / (TOWER_ORDER.length - 1));
    }
    var j = TIER4_ORDER.indexOf(key), a = Math.round(N * 0.45) + 1, b = Math.round(N * 0.9);
    return a + Math.round(j * (b - a) / (TIER4_ORDER.length - 1));
  }

  var statCache = {};
  function stats(type, lv) {
    var k = type + lv;
    if (statCache[k]) return statCache[k];
    var d = TOWERS[type], s = { look: d.look, n: 1, layers: 1, moab: 0 };
    Object.keys(d.base).forEach(function (f) { s[f] = d.base[f]; });
    for (var i = 0; i < lv - 1; i++) d.up[i].fx(s);
    return (statCache[k] = s);
  }

  var D = { FPS: FPS, W: W, H: H, PATH: PATH, CPU: CPU, TRACK: TRACK, WATER: WATER, ENEMIES: ENEMIES, ENEMY_KEYS: ENEMY_KEYS,
    RBE: RBE, roundMix: roundMix, buildRound: buildRound, spawnGap: spawnGap, DIFF: DIFF, START_CASH: START_CASH, SELL: SELL,
    price: price, speedBonus: speedBonus, roundPool: roundPool, popShare: popShare, TOWERS: TOWERS, TOWER_ORDER: TOWER_ORDER,
    TIER4_ORDER: TIER4_ORDER, unlockRound: unlockRound, stats: stats };
  root.CSData = D;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
