// Builds LessonData/y6-3-1-iconnect.json: Year 6, 6.3.1: What Is a Network? (plan 2.1 iConnect: a computer network
// is a group of computers that are connected; networks let users communicate and share). The first lesson of the
// Computer Networks unit.   node tools/build_y6_3_1_iconnect.mjs
// It writes the plenary drill y6-3-1-iconnect and registers a "6.3 Computer Networks" unit after 6.2 in lessons.json.
// Do Now: Scratch recap (Year 6 has no exam papers); the Extension reuses y6-term1-revision.
// Activities: Network Builder (pages repo NetLab/, registry id network-builder): activity=build and activity=fix.
// The internet, routers, packets and addresses are later lessons (2.2, 2.3), so they are not named here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y6-3-1-iconnect';
const P = 'y6-31';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const blocks = (t) => `<div class="scratchblocks-card"><pre class="blocks">${esc(t)}</pre></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px;font-family:var(--font-mono, monospace)">${t}</p>`;
const num = (n) => '^\\s*' + (n < 0 ? '[-−]\\s*' + Math.abs(n) : String(n)) + '\\s*$';

// Small pictures: laptops, a printer, a switch, joined or not.
const LAPTOP = (x, y, name) => `<g><rect x="${x - 24}" y="${y - 24}" width="48" height="32" rx="4" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x - 19}" y="${y - 19}" width="38" height="22" rx="2" fill="var(--brand-soft)"/><rect x="${x - 31}" y="${y + 8}" width="62" height="7" rx="3" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const PRINTER = (x, y) => `<g><rect x="${x - 15}" y="${y - 28}" width="30" height="15" rx="2" fill="#f4f6fa" stroke="var(--ink-soft)"/><rect x="${x - 28}" y="${y - 15}" width="56" height="28" rx="6" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Printer</text></g>`;
const SWITCH = (x, y) => `<g><rect x="${x - 46}" y="${y - 14}" width="92" height="28" rx="5" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${x - 38 + i * 10}" y="${y - 5}" width="7" height="7" rx="1" fill="var(--surface)" stroke="var(--brand)"/>`).join('')}<text x="${x}" y="${y + 32}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Switch</text></g>`;
const CABLE = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink-soft)" stroke-width="5" stroke-linecap="round"/>`;
const pic = (w, h, inner, caption) => `<figure style="margin:0;text-align:center"><svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;height:auto">${inner}</svg><figcaption style="font-size:15px;color:var(--muted)">${caption}</figcaption></figure>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, lead, parts, whyQ, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label}</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off" inputmode="numeric"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, lead, items, whyQ, script) {
  const cid = `${P}-${id}`;
  const body = script ? `<div class="igame-two-col">${blocks(script)}<div id="${cid}"></div></div>` : `<div id="${cid}"></div>`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + body, items };
}
function embed(id, label, appId, lead, whyQ, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the answer') + body };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1: fix the score (6.2.3 variables, 6.2.6 bugs)
const CATCHER = 'when flag clicked\nset [score v] to (0)\nforever\nif <touching [Basket v] ?> then\nset [score v] to (1)\ngo to x: (0) y: (180)\nend\nend';
steps.push(mcStep('do-now', 'Do Now: Fix the Score (1 of 2)', 'Recap of 6.2.3 and 6.2.6. This is the Fruit script in a Fruit Catcher game.', [
  { prompt: 'Every catch should add 1 to the score. After three catches the score is still 1. Which block should replace set [score] to (1)?', options: ['change [score] by (1)', 'set [score] to (0)', 'go to x: (0) y: (0)'], correct: 0,
    explain: 'set [score] to (1) puts the score back to 1 on every catch. change [score] by (1) adds 1 each time: 1, 2, 3.' },
  { prompt: 'Which block sends the fruit back to the top after a catch?', options: ['go to x: (0) y: (180)', 'set [score] to (1)', 'forever'], correct: 0,
    explain: 'go to x: (0) y: (180) moves the fruit to the middle of the top of the stage, so it can fall again.' },
], ['Why does set [score] to (1) never get past 1, however many fruit you catch?', 'set always puts the score to the same number. It does not add to what was there before.'], CATCHER));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: a variable that will not change', steps: [
  { text: '<strong>A similar script.</strong> In a Bat game, the player loses a life each time the Bat touches the Cat. The game starts with 3 lives, but lives stays at 2.', visual: note('set [lives] to (3) at the flag, then set [lives] to (2) when touching Bat') },
  { text: 'Play it in your head. Touch the Bat once: lives is set to 2.', visual: line('lives: 3 &rarr; ' + kw('2')) },
  { text: 'Touch the Bat again. The same block runs: lives is set to 2 again. It never goes lower.', visual: line('lives: 2 &rarr; ' + kw('2')) },
  { text: 'A <b>set</b> block always gives the same number. To go down by one each time, the game needs a block that takes 1 away from what is already there.', visual: line(kw('change [lives] by (-1)') + ': 3, 2, 1, 0') },
  { text: 'Now look at the Fruit Catcher script. Which block keeps putting the score to the same number, and which block would add 1 each time?', visual: note('set gives the same number; change adds to it') },
] };

// ---------------------------------------------------------------- Do Now 2: trace a sprite (6.2.1 coordinates, 6.2.2 loops)
const TRACE = 'when flag clicked\ngo to x: (0) y: (0)\nrepeat (3)\nchange x by (20)\nend\nchange y by (-30)';
steps.push(checkStep('do-now-2', 'Do Now: Where Does It End? (2 of 2)', 'Recap of 6.2.1 and 6.2.2. Run the script in your head.', [
  { label: 'What is x at the end?', answer: num(60), feedback: 'The loop runs 3 times. How much does x change each time?' },
  { label: 'What is y at the end?', answer: num(-30), feedback: 'y starts at 0. Which block changes y, and by how much?' },
], ['Why does the block after the loop run only once, but the block inside runs many times?', 'Only the blocks inside the repeat are repeated. The block after it runs once, when the loop has finished.'], blocks(TRACE)));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: tracing a loop', steps: [
  { text: '<strong>A similar script.</strong> go to x: (0) y: (0), then repeat (4) with change x by (10) inside, then change y by (50) after the loop.', visual: note('go to x: (0) y: (0) &middot; repeat (4) { change x by (10) } &middot; change y by (50)') },
  { text: 'Start: the sprite goes to x: 0, y: 0.', visual: line('x = 0, y = 0') },
  { text: 'The loop runs 4 times. Each time, x goes up by 10: 10, 20, 30, 40.', visual: line('x: 0 &rarr; 10 &rarr; 20 &rarr; 30 &rarr; ' + kw('40')) },
  { text: 'After the loop, change y by (50) runs once: y goes from 0 to 50.', visual: line('y: 0 &rarr; ' + kw('50')) },
  { text: 'Now do the same for the Do Now script: count the loops, add up the x changes, then do the block after the loop.', visual: note('loop first, then the block after it') },
] };

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y6-term1-revision',
  '<strong>Extension:</strong> finished the Do Now? Try these Scratch questions from last term. Stuck? Turn on <strong>I need help</strong>.',
  ['Why keep practising Scratch when we start a new topic?', 'Skills you do not use are easy to forget. A few questions keep them fresh.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'What Is a Network?',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">6.3 Computer Networks</p><h2 class="lesson-h2">What Is a Network?</h2><p>Year 6</p></div>' +
    facts(['<strong>Today:</strong> what a computer <strong>network</strong> is.', 'Why people join computers together: to <strong>communicate</strong> and to <strong>share</strong>.', 'Build your own network, then fix one that is broken.']) +
    why('You want to send a photo from your laptop to a friend\'s laptop in the same room. What would you need?', 'Some way for the two laptops to be joined, so the photo can travel from one to the other.') });

// ---------------------------------------------------------------- what is a network
const twoApart = pic(300, 120, LAPTOP(70, 50, 'Mai') + LAPTOP(230, 50, 'Ben'), 'Not joined');
const twoJoined = pic(300, 120, CABLE(70, 50, 230, 50) + LAPTOP(70, 50, 'Mai') + LAPTOP(230, 50, 'Ben'), 'Joined by a cable');
steps.push(concept('concept-network', 'What Is a Network?',
  'Look at the two pictures. Predict: in which picture can Mai send Ben a photo? Why can she not in the other?',
  '<p>Only in the second picture. In the first, nothing joins the laptops, so the photo has no way to travel to Ben.</p>',
  columns(facts(['A <strong>network</strong> is two or more computers that are <strong>joined together</strong>.', 'They can be joined by <strong>cables</strong>, or with no cable, using <strong>Wi-Fi</strong>.',
    'When they are joined, data such as a photo or a message can travel from one to another.', 'Computers that are not joined cannot share anything.']),
    '<div style="display:grid;gap:8px">' + twoApart + twoJoined + '</div>')));

steps.push(mcStep('predict-network', 'Predict: Is It a Network?', '', [
  { prompt: 'Which of these is a network?', options: ['Three laptops on a table, with no cables and no Wi-Fi', 'Three laptops joined together by cables', 'One laptop on its own'], correct: 1,
    explain: 'A network needs two or more computers that are joined. Laptops sitting next to each other are not joined.' },
  { prompt: 'Mai and Ben\'s laptops are both on the school Wi-Fi. There is no cable. Are they on a network?', options: ['Yes', 'No'], correct: 0,
    explain: 'Wi-Fi joins computers with no cable. They are joined, so they are on a network.' },
], ['Why is "the laptops are next to each other" not enough to make a network?', 'Being close does not join them. Data can only travel if there is a cable or Wi-Fi between them.']));

const shared = pic(380, 200, CABLE(190, 110, 60, 40) + CABLE(190, 110, 320, 40) + CABLE(190, 110, 60, 170) + CABLE(190, 110, 320, 170) +
  SWITCH(190, 110) + LAPTOP(60, 40, 'Ana') + LAPTOP(320, 40, 'Ben') + LAPTOP(60, 170, 'Chi') + PRINTER(320, 170), 'Three laptops sharing one printer');
// ---------------------------------------------------------------- one socket, so a switch
const cableTwo = pic(300, 110, CABLE(70, 45, 230, 45) + LAPTOP(70, 45, 'Ana') + LAPTOP(230, 45, 'Ben'), 'Two laptops: one cable works');
steps.push(concept('concept-switch', 'Why Do We Need a Switch?',
  'Ana\'s laptop is joined to Ben\'s by a cable. Chi wants to join too, but each laptop has only one place to plug in a network cable. Predict: how could all three be joined?',
  '<p>Plug each laptop into a box with lots of places for cables. Then data can go from one laptop, through the box, to another.</p>',
  columns(facts(['A laptop or a printer has <strong>one network socket</strong>: the place a network cable plugs in.', 'So two laptops can be joined by one cable, but a third cannot plug in.',
    'A <strong>switch</strong> is a box with many sockets. Plug every device into the switch.', 'Data goes from one laptop, <strong>through the switch</strong>, to the device it is for.']),
    '<div style="display:grid;gap:8px">' + cableTwo + shared.replace('Three laptops sharing one printer', 'Every device plugged into a switch') + '</div>')));

// ---------------------------------------------------------------- why join computers
steps.push(concept('concept-share', 'Why Join Computers Together?',
  'A school has 30 laptops. Predict: why might it buy just one printer, and not 30?',
  '<p>If the laptops are on a network, all 30 can use the same printer. One printer costs much less than 30.</p>',
  columns(facts(['Networks let people <strong>communicate</strong>: send messages and emails, and make video calls.', 'Networks let people <strong>share</strong>: files, photos, and devices such as a printer.',
    'Sharing saves money: one printer for a whole class.', 'Sharing saves time: a file can go straight to a friend\'s laptop.']), shared)));

steps.push(mcStep('predict-share', 'Predict: Does It Need a Network?', '', [
  { prompt: 'Which of these needs a network?', options: ['Mai video calls her grandma', 'Mai draws a picture on her laptop', 'Mai plays a game on her own laptop'], correct: 0,
    explain: 'A video call sends pictures and sound between two computers, so they must be joined. The others happen on one laptop.' },
  { prompt: 'A class has 20 laptops and one printer, all on a network. Why is this better than a printer for every laptop?', options: ['It costs less: they all share one printer', 'The printer prints faster', 'The laptops do not need charging'], correct: 0,
    explain: 'Sharing one printer over the network means the school buys one printer, not twenty.' },
], ['Why can a video call not work between two computers that are not joined?', 'The sound and pictures have to travel from one computer to the other, and with nothing joining them they cannot.']));

steps.push(embed('activity-1', 'Activity 1: Build a Network', 'network-builder',
  'Follow the missions on the right. Drag devices onto the desk, drag from a green socket to plug in a cable, then test it with Send.',
  ['Why test with Send before you press Check?', 'Testing shows whether the data really gets there. You find a mistake before it counts.'], 'activity=build'));

steps.push(checkStep('check-cables', 'Check: Count the Cables', 'Every device is plugged into one switch. Each laptop and printer has one network socket.', [
  { label: '4 laptops and 1 printer are joined by a switch. How many cables?', answer: num(5), feedback: 'Each device needs one cable, to the switch. How many devices are there?' },
  { label: '2 more laptops join the same switch. How many cables now?', answer: num(7), feedback: 'Each new laptop needs its own cable.' },
], ['Why does a switch need lots of sockets, when a laptop needs only one?', 'Every device on the network plugs into the switch, so it needs a socket for each of them. A laptop only plugs into one thing.'],
  pic(380, 200, CABLE(190, 110, 60, 40) + CABLE(190, 110, 320, 40) + CABLE(190, 110, 60, 170) + CABLE(190, 110, 320, 170) + SWITCH(190, 110) + LAPTOP(60, 40, 'Ana') + LAPTOP(320, 40, 'Ben') + LAPTOP(60, 170, 'Chi') + PRINTER(320, 170), 'Example: 3 laptops and 1 printer')));

steps.push(embed('activity-2', 'Activity 2: Predict, then Fix', 'network-builder',
  'First predict which jobs will work, then fix the network. One check each: a mistake means that network does not count.',
  ['Why predict before you fix it?', 'Predicting shows you can follow the cables yourself. Fixing first would hide what was wrong.'], 'activity=fix'));

steps.push(embed('plenary', 'Plenary: Networks Drill', 'drill-' + ID,
  'What a network is, why we join computers, and switches. Your progress is saved.',
  ['Why does the drill bring back a question you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, category, prompt, answers, distractors, noteText, working) => ({ id, category, prompt, answers, distractors, working, note: noteText });
const cards = [
  card('n-cable', 'network', 'Mai\'s laptop and Ben\'s laptop are joined by a cable. Can Mai send Ben a photo?', ['Yes'], ['No'], 'They are joined, so the photo can travel along the cable.', ['Is anything joining the two laptops?', 'Data travels along the cable.']),
  card('n-apart', 'network', 'Mai\'s laptop and Ben\'s laptop are on the same table. There is no cable and no Wi-Fi. Can Mai send Ben a file?', ['No'], ['Yes'], 'Being close does not join them. With no cable or Wi-Fi, the file cannot travel.', ['Is anything joining the two laptops?', 'Being next to each other is not the same as joined.']),
  card('n-which', 'network', 'Which of these is a network?', ['Three laptops, each plugged into a switch'], ['Three laptops on a table, with no cables', 'One laptop on its own', 'A printer that is not plugged in'], 'A network is two or more computers joined together.', ['Count the computers. Are there two or more?', 'Are they joined?']),
  card('n-print', 'network', 'Ana\'s laptop and the Printer are both plugged into the same switch. Can Ana print?', ['Yes'], ['No'], 'Ana &rarr; Switch &rarr; Printer: the data gets there.', ['Follow the cable from Ana.', 'Where does the switch send it on to?']),
  card('n-unplug', 'network', 'Ana\'s laptop is plugged into the switch. The Printer\'s cable is not plugged in. Can Ana print?', ['No'], ['Yes'], 'The Printer is not joined to anything, so nothing can reach it.', ['Follow the cable from Ana to the switch.', 'Is the Printer joined to the switch?']),
  card('s-call', 'share', 'Which of these needs a network?', ['Mai video calls her friend'], ['Mai draws a picture on her laptop', 'Mai plays a game on her own laptop', 'Mai types a story and saves it on her laptop'], 'A video call sends sound and pictures between two computers.', ['Which one sends something to another computer?', 'The others happen on one laptop only.']),
  card('s-printer', 'share', 'A school has 20 laptops on a network. Why share one printer, and not buy 20 printers?', ['It costs less'], ['The laptops print in colour', 'The laptops go faster', 'The printer needs no paper'], 'One shared printer costs much less than 20 printers.', ['How many printers would the school have to buy?', 'Sharing means many people use one thing.']),
  card('s-file', 'share', 'Ben has a story on his laptop. Mai wants to read it on her laptop. Their laptops are on a network. What can Ben do?', ['Share the file with Mai over the network'], ['Save it again on his own laptop', 'Turn his laptop off', 'Make the file bigger'], 'On a network, a file can go straight from one laptop to another.', ['The story needs to get to Mai\'s laptop.', 'What does a network let people do with files?']),
  card('w-socket', 'switch', 'How many network sockets does a laptop have?', ['1'], ['8', '3', '0'], 'A laptop has one network socket, so it can plug into one thing.', ['Think about the Network Builder: how many cables could one laptop take?', 'When you tried to plug in a second cable, what happened?']),
  card('w-three', 'switch', 'Three laptops must be joined. Each has one network socket. What do you need?', ['A switch'], ['Two more printers', 'A longer cable', 'A bigger screen'], 'A switch has many sockets, so every laptop can plug into it.', ['One socket each means one cable each.', 'What has lots of sockets?']),
  card('w-count', 'switch', '5 laptops and 1 printer are each plugged into one switch. How many cables are there?', ['6'], ['5', '1', '12'], 'One cable for each device: 5 + 1 = 6.', ['Each device has one cable, to the switch.', 'Count the laptops and the printer.']),
  card('w-pair', 'switch', 'Ana\'s laptop is plugged straight into Ben\'s laptop. Can Chi plug her laptop into Ana\'s too?', ['No'], ['Yes'], 'Ana\'s only socket is already used by the cable to Ben.', ['How many sockets does Ana\'s laptop have?', 'Is it free?']),
  card('w-rooms', 'switch', 'Room 1 and Room 2 each have a switch. No cable joins the two switches. Can a laptop in Room 1 print on the printer in Room 2?', ['No'], ['Yes'], 'The two networks are not joined, so the data cannot get from Room 1 to Room 2.', ['Follow the cables from the laptop in Room 1.', 'Does any cable go to Room 2?']),
  card('w-join', 'switch', 'Room 1 and Room 2 each have a switch, and only Room 2 has a printer. What is the fewest new cables so that every laptop can print?', ['1'], ['2', '3', '0'], 'One cable from Switch 1 to Switch 2 joins the two networks into one.', ['A switch has many sockets, so it has room for another cable.', 'What could you join to join every device in both rooms at once?']),
];
const drill = { title: 'Year 6, 6.3.1: What Is a Network?', subtitle: 'Computer networks: joining computers to communicate and share', choiceOnly: true,
  categories: [['network', 'What Is a Network?'], ['share', 'Why Join Computers?'], ['switch', 'Switches and Cables']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 1 && c.working.length === 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
const drillSrc = `// Year 6, 6.3.1: What Is a Network? Plenary: networks, why we join computers, switches and cables.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y6_3_1_iconnect.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['60', ' 60 '], ['20', '600', '-60']);
ok('do-now-2', 1, ['-30', '−30', '- 30'], ['30', '0', '-300']);
ok('check-cables', 0, ['5'], ['4', '6']);
ok('check-cables', 1, ['7'], ['6', '2']);
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
{ const bad = /mario|internet|router|packet|\bIP\b|address|server|world wide web|\bwww\b|\bLAN\b|\bWAN\b/i.exec(all.split('do-now').join(''));
  assert(!bad, 'term taught later: ' + (bad ? bad[0] + ' in ' + all.slice(Math.max(0, bad.index - 60), bad.index + 30) : '')); }
// "switch" and "socket" are taught on concept-switch: nothing before it may use them.
{ const at = steps.findIndex((s) => s.id === 'concept-switch');
  const before = JSON.stringify(steps.slice(0, at).map((s) => Object.assign({}, s, { content: s.content.replace(/<svg[\s\S]*?<\/svg>/g, '') })));
  assert(!/socket/i.test(before), 'socket used before it is taught');
  const m = /\bswitch\b/i.exec(before);
  assert(!m, 'switch used before it is taught: ' + (m ? before.slice(m.index - 80, m.index + 20) : '')); }

const lesson = { id: ID, label: '6.3.1: What Is a Network?', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: a "6.3" unit after "6.2"
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const y6 = data.years.find((y) => y.id === 'year6');
    assert(y6, 'year6 in lessons.json');
    const at = y6.units.findIndex((u) => u.code === '6.2');
    assert(at >= 0, '6.2 unit');
    y6.units.splice(at + 1, 0, Object.assign({}, y6.units[at], { code: '6.3', title: 'Computer Networks', lessons: [ID] }));
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
