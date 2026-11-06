// Builds LessonData/y6-3-2-iroute.json: Year 6, 6.3.2: Joining Networks Together (plan 2.2 iRoute: the internet is
// many networks that are connected to each other; a router sends and receives information as packets of data).
//   node tools/build_y6_3_2_iroute.mjs
// It writes the plenary drill y6-3-2-iroute and adds the lesson after y6-3-1-iconnect in lessons.json.
// Do Now: last lesson (networks, switches, sharing); the Extension reuses the y6-3-1-iconnect drill.
// Activities: Network Builder 3D (pages repo NetLab3D/, registry id network-builder-3d) in lesson mode 2.2,
// part=1 (Join Two Networks, The Internet, Hop by Hop) and part=2 (Messages in Packets, Different Paths,
// Find Another Way, Connect the Town).
// Terms taught here, each on its own slide: router, internet, route, packet. Addresses and websites are 2.3.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y6-3-2-iroute';
const AFTER = 'y6-3-1-iconnect';
const P = 'y6-32';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px;font-family:var(--font-mono, monospace)">${t}</p>`;
const num = (n) => '^\\s*' + String(n) + '\\s*$';

// ---------------------------------------------------------------- small pictures
const LAPTOP = (x, y, name) => `<g><rect x="${x - 24}" y="${y - 24}" width="48" height="32" rx="4" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x - 19}" y="${y - 19}" width="38" height="22" rx="2" fill="var(--brand-soft)"/><rect x="${x - 31}" y="${y + 8}" width="62" height="7" rx="3" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const PRINTER = (x, y) => `<g><rect x="${x - 15}" y="${y - 28}" width="30" height="15" rx="2" fill="#f4f6fa" stroke="var(--ink-soft)"/><rect x="${x - 28}" y="${y - 15}" width="56" height="28" rx="6" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Printer</text></g>`;
const SWITCH = (x, y, name = 'Switch') => `<g><rect x="${x - 46}" y="${y - 14}" width="92" height="28" rx="5" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${x - 38 + i * 10}" y="${y - 5}" width="7" height="7" rx="1" fill="var(--surface)" stroke="var(--brand)"/>`).join('')}<text x="${x}" y="${y + 32}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const ROUTER = (x, y, name = 'Router') => `<g><line x1="${x - 20}" y1="${y - 12}" x2="${x - 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><line x1="${x + 20}" y1="${y - 12}" x2="${x + 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><rect x="${x - 34}" y="${y - 12}" width="68" height="24" rx="6" fill="#fde7c7" stroke="#c77700" stroke-width="2"/><circle cx="${x - 20}" cy="${y}" r="3" fill="#2f9e44"/><circle cx="${x - 10}" cy="${y}" r="3" fill="#2f9e44"/><text x="${x}" y="${y + 30}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const CABLE = (x1, y1, x2, y2, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink-soft)" stroke-width="5" stroke-linecap="round"${dash ? ' stroke-dasharray="2 10"' : ''}/>`;
const BOX = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 5"/><text x="${x + 10}" y="${y + 20}" fill="var(--muted)" font-size="15" font-weight="700">${label}</text>`;
const PKT = (x, y, n, word) => `<g><rect x="${x - 34}" y="${y - 20}" width="68" height="40" rx="6" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/><circle cx="${x - 34}" cy="${y - 20}" r="12" fill="var(--brand)"/><text x="${x - 34}" y="${y - 15}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${n}</text><text x="${x + 4}" y="${y + 6}" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="600">${word}</text></g>`;
const ARROW = (x1, y, x2) => `<line x1="${x1}" y1="${y}" x2="${x2 - 10}" y2="${y}" stroke="var(--ink-soft)" stroke-width="3"/><path d="M${x2 - 12} ${y - 7} L${x2} ${y} L${x2 - 12} ${y + 7} Z" fill="var(--ink-soft)"/>`;
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
function mcStep(id, label, lead, items, whyQ, picture) {
  const cid = `${P}-${id}`;
  const body = picture ? `<div class="igame-two-col"><div>${picture}</div><div id="${cid}"></div></div>` : `<div id="${cid}"></div>`;
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

// ---------------------------------------------------------------- Do Now 1: can it print? (6.3.1)
const officePic = pic(380, 200, CABLE(190, 110, 60, 40) + CABLE(190, 110, 320, 40) + CABLE(190, 110, 320, 170) +
  SWITCH(190, 110) + LAPTOP(60, 40, 'Ana') + LAPTOP(320, 40, 'Ben') + LAPTOP(60, 170, 'Chi') + PRINTER(320, 170), 'Follow the cables');
steps.push(mcStep('do-now', 'Do Now: Follow the Cables (1 of 2)', 'Recap of 6.3.1. Look at the cables in the picture.', [
  { prompt: 'Can Ana print on the Printer?', options: ['Yes', 'No'], correct: 0,
    explain: 'Ana &rarr; Switch &rarr; Printer. Both are plugged into the switch, so the data gets there.' },
  { prompt: 'Can Chi send Ben a message?', options: ['Yes', 'No'], correct: 1,
    explain: 'Chi has no cable. Chi is not joined to the switch, so nothing can travel from Chi.' },
], ['Why might a school join all its laptops into one network?', 'So people can communicate, and share things such as files and one printer.'], officePic));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: following the cables', steps: [
  { text: '<strong>A similar network.</strong> Mai and Tom are plugged into a switch. The Printer is plugged in too. Sam is on the table with no cable.', visual: note('Mai, Tom, Printer: cables to the switch. Sam: no cable.') },
  { text: 'Can Mai print? Start at Mai and follow her cable.', visual: line('Mai &rarr; ' + kw('Switch')) },
  { text: 'The switch passes the data on. Is the Printer plugged into the switch too? Yes, so the data gets there.', visual: line('Mai &rarr; Switch &rarr; ' + kw('Printer')) },
  { text: 'Can Sam send Tom a message? Start at Sam. There is no cable to follow, so the message cannot leave.', visual: line('Sam &rarr; ' + kw('?')) },
  { text: 'Now look at the Do Now picture. Start at Ana, then start at Chi. Follow each cable to the switch, then on.', visual: note('start at the sender, follow the cable') },
] };

// ---------------------------------------------------------------- Do Now 2: count the cables (6.3.1)
steps.push(checkStep('do-now-2', 'Do Now: Count the Cables (2 of 2)', 'Recap of 6.3.1. Each laptop and printer has one network socket.', [
  { label: '6 laptops and 1 printer are each plugged into one switch. How many cables?', answer: num(7), feedback: 'One cable for each device, to the switch. Count the laptops and the printer.' },
  { label: 'Room 1 has a switch. Room 2 has a switch. What is the fewest new cables to join the two rooms into one network?', answer: num(1), feedback: 'A switch has many sockets. What could you plug together?' },
], ['Why does each device need a cable of its own to the switch?', 'Each device has only one socket, and data can only travel along a cable or Wi-Fi.'],
  pic(380, 200, CABLE(190, 110, 60, 40) + CABLE(190, 110, 320, 40) + CABLE(190, 110, 60, 170) + CABLE(190, 110, 320, 170) + SWITCH(190, 110) + LAPTOP(60, 40, 'Ana') + LAPTOP(320, 40, 'Ben') + LAPTOP(60, 170, 'Chi') + PRINTER(320, 170), 'Example: 3 laptops and 1 printer')));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: counting cables', steps: [
  { text: '<strong>A similar question.</strong> 4 laptops and 2 printers are each plugged into one switch. How many cables?', visual: note('4 laptops, 2 printers, 1 switch') },
  { text: 'Each device has one socket, so each device has one cable, going to the switch.', visual: line('1 device = 1 cable') },
  { text: 'Count the devices: 4 laptops and 2 printers.', visual: line('4 + 2 = ' + kw('6') + ' cables') },
  { text: '<strong>Two rooms.</strong> Room A and Room B each have a switch. A switch has many sockets, so one switch can plug into the other.', visual: line('Switch A &rarr; ' + kw('Switch B')) },
  { text: 'Now do the Do Now: count the devices for part a. For part b, think how few cables join the two switches.', visual: note('one cable each; switches can join switches') },
] };

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-' + AFTER,
  '<strong>Extension:</strong> finished the Do Now? Try more questions from last lesson. Stuck? Turn on <strong>I need help</strong>.',
  ['Why practise last lesson before we learn something new?', 'Today builds on networks and switches. If you remember them, today is easier.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Joining Networks Together',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">6.3 Computer Networks</p><h2 class="lesson-h2">Joining Networks Together</h2><p>Year 6</p></div>' +
    facts(['<strong>Today:</strong> how two networks can be joined.', 'How data travels a long way, all round the world.', 'Join networks in the 3D lab, then send data across them.']) +
    why('Your home has a network. Your school has a network. Predict: can a laptop at home send a message to a laptop at school? What would it need?', 'Only if something joins the two networks, so the message can pass from one to the other.') });

// ---------------------------------------------------------------- router
const twoNets = pic(460, 230, BOX(10, 10, 170, 210, 'Home') + BOX(280, 10, 170, 210, 'School') +
  CABLE(95, 150, 50, 70) + CABLE(95, 150, 140, 70) + CABLE(365, 150, 320, 70) + CABLE(365, 150, 410, 70) + CABLE(95, 150, 230, 150) + CABLE(230, 150, 365, 150) +
  SWITCH(95, 150, 'Switch') + SWITCH(365, 150, 'Switch') + ROUTER(230, 150) + LAPTOP(50, 70, 'Ana') + LAPTOP(140, 70, 'Ben') + LAPTOP(320, 70, 'Chi') + LAPTOP(410, 70, 'Dev'), 'A router joins the home network to the school network');
steps.push(concept('concept-router', 'Joining Two Networks',
  'Home and school each have a network with a switch. Nothing joins the two networks. Predict: can Ana at home send Chi at school a message? Why?',
  '<p>No. Nothing joins the two networks, so the message has no way to get from home to school.</p>',
  columns(facts(['A <strong>switch</strong> joins the devices <strong>inside one</strong> network.', 'A <strong>router</strong> joins two or more <strong>networks</strong> together.',
    'Data from Ana goes to her switch, then to the router.', 'The router <strong>sends</strong> it on to the school network, where Chi <strong>receives</strong> it.']), twoNets)));

steps.push(mcStep('predict-router', 'Predict: Switch or Router?', '', [
  { prompt: 'Which joins the laptops inside one classroom?', options: ['A switch', 'A router', 'A printer'], correct: 0,
    explain: 'A switch joins the devices inside one network.' },
  { prompt: 'Which joins the home network to the school network?', options: ['A router', 'A switch', 'A printer'], correct: 0,
    explain: 'A router joins different networks and passes data between them.' },
  { prompt: 'The cable from the router to the school switch comes out. Can Ana still send Chi a message?', options: ['No', 'Yes'], correct: 0,
    explain: 'The router is no longer joined to the school network, so the message cannot get there.' },
], ['Why is it not enough for the home network and the school network to be close to each other?', 'Being close does not join them. Data can only travel along a cable or Wi-Fi.']));

// ---------------------------------------------------------------- the internet
const netOfNets = pic(520, 335, BOX(10, 10, 160, 172, 'Home') + BOX(350, 10, 160, 172, 'School') + BOX(170, 248, 180, 82, 'Shop') +
  CABLE(90, 80, 90, 152) + CABLE(430, 80, 430, 152) +
  CABLE(90, 152, 190, 218) + CABLE(430, 152, 330, 218) + CABLE(190, 218, 330, 218) + CABLE(275, 302, 190, 218) + CABLE(275, 302, 330, 218) +
  LAPTOP(90, 80, 'Ana') + LAPTOP(430, 80, 'Ben') + ROUTER(90, 152, '') + ROUTER(430, 152, '') + ROUTER(275, 302, '') + ROUTER(190, 218, '') + ROUTER(330, 218, ''),
  'Each network has a router. The routers are joined to each other.');
steps.push(concept('concept-internet', 'What Is the Internet?',
  'There are millions of networks in homes, schools and shops. Predict: how could a laptop in Bangkok send a message to a laptop in London?',
  '<p>The networks are joined to each other by routers. The message passes from router to router until it reaches London.</p>',
  columns(facts(['The <strong>internet</strong> is many networks that are <strong>joined to each other</strong>.', 'Every home, school and shop network has a <strong>router</strong>.',
    'The routers are joined to other routers, all round the world.', 'So a message can travel from any network to any other network.']), netOfNets)));

// ---------------------------------------------------------------- route, hop by hop
const chain = (labels, caption, broken = -1) => {
  const xs = labels.map((_, i) => 40 + i * 92);
  let s = '';
  for (let i = 0; i + 1 < labels.length; i++) s += CABLE(xs[i], 60, xs[i + 1], 60, i === broken);
  labels.forEach((l, i) => { s += (i === 0 || i === labels.length - 1) ? LAPTOP(xs[i], 60, l) : ROUTER(xs[i], 60, l); });
  return pic(xs[xs.length - 1] + 40, 110, s, caption);
};
const routePic = chain(['Ana', 'Home', 'A', 'B', 'School', 'Ben'], 'Ana &rarr; Home router &rarr; Router A &rarr; Router B &rarr; School router &rarr; Ben');
steps.push(concept('concept-route', 'Router to Router',
  'Look at the picture. No cable goes straight from Ana to Ben. Predict: how does Ana\'s message still get to Ben?',
  '<p>Each router passes the message on to the next one, one step closer to Ben, until it arrives.</p>',
  facts(['The path data takes from one device to another is its <strong>route</strong>.', 'Each router <strong>receives</strong> the data, then <strong>sends</strong> it on to the next router.',
    'No one cable goes all round the world. So data travels a long way one step at a time.']) + routePic));

const fourPic = chain(['Ana', 'Home', 'A', 'B', 'C', 'School', 'Ben'], 'Ana\'s message to Ben');
steps.push(mcStep('predict-route', 'Predict: Follow the Route', 'Look at the route from Ana to Ben.', [
  { prompt: 'How many routers does the message pass through, from Ana to Ben?', options: ['5', '4', '7'], correct: 0,
    explain: 'Home router, Router A, Router B, Router C, School router: 5 routers. Ana and Ben are laptops, not routers.' },
  { prompt: 'The cable between Router B and Router C breaks. There is no other route. Can Ana send Ben a message?', options: ['No', 'Yes'], correct: 0,
    explain: 'The only route is broken in the middle, so the message cannot get past Router B.' },
], ['Why might a message to a faraway country pass through many routers?', 'No single cable goes that far. Each router passes it on towards where it is going.'], fourPic));

steps.push(embed('activity-1', 'Activity 1: Join Networks with Routers', 'network-builder-3d',
  'Do the missions on the right in order: Join Two Networks, The Internet, then Hop by Hop. Predict before you send. Walk with W A S D.',
  ['Why try to send a message before you add the router?', 'You see it fail. Then you know it is the router that makes it work.'], 'lesson=2.2&part=1'));

// ---------------------------------------------------------------- packets
const splitPic = pic(470, 150, `<rect x="10" y="20" width="120" height="90" rx="6" fill="var(--brand-soft)" stroke="var(--ink-soft)" stroke-width="2"/><text x="70" y="72" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="700">Photo</text>` +
  ARROW(140, 65, 200) + PKT(260, 40, 1, 'part') + PKT(380, 40, 2, 'part') + PKT(260, 105, 3, 'part') + PKT(380, 105, 4, 'part'), 'One photo, split into 4 numbered packets');
steps.push(concept('concept-packets', 'Data in Packets',
  'A big photo has to cross the internet. Predict: is it better to send it in one big piece, or in lots of small parts? Why?',
  '<p>Lots of small parts. If one small part gets lost, only that part is sent again. And many people can share the same cables, taking turns.</p>',
  columns(facts(['Data is split into small parts called <strong>packets</strong>.', 'Routers send and receive data as <strong>packets</strong>. Each packet travels on its own.',
    'At the end, the packets are put back together.', 'If one packet is lost, only that one is sent again.']), splitPic)));

const orderPic = pic(470, 175, `<text x="10" y="22" fill="var(--muted)" font-size="15" font-weight="700">They arrive:</text>` + PKT(60, 55, 3, 'pizza') + PKT(170, 55, 1, 'We') + PKT(280, 55, 4, 'today') + PKT(390, 55, 2, 'like') +
  `<text x="10" y="112" fill="var(--muted)" font-size="15" font-weight="700">Sorted by number:</text>` + PKT(60, 145, 1, 'We') + PKT(170, 145, 2, 'like') + PKT(280, 145, 3, 'pizza') + PKT(390, 145, 4, 'today'), 'The numbers put the message back in order');
steps.push(concept('concept-numbers', 'Why Number the Packets?',
  'Packets can take different routes, and some routes are slower. Predict: what could go wrong when the packets arrive?',
  '<p>They could arrive in the wrong order, so the message or photo would be mixed up.</p>',
  columns(facts(['Each packet has a <strong>number</strong>.', 'Packets can take <strong>different routes</strong>, so they can arrive in a different order.',
    'The computer at the end sorts the packets by their numbers.', 'If a link breaks, routers send the packets another way, if there is one.']), orderPic)));

steps.push(mcStep('predict-packets', 'Predict: Put It Back Together', '', [
  { prompt: 'These packets arrive: 3 "the", 1 "Please", 4 "door", 2 "open". What is the message?', options: ['Please open the door', 'the Please door open', 'Please the open door'], correct: 0,
    explain: 'Sort by number: 1 Please, 2 open, 3 the, 4 door.' },
  { prompt: 'Why does each packet have a number?', options: ['So the packets can be put back in the right order', 'So the packets travel faster', 'So the cable knows which laptop to go to'], correct: 0,
    explain: 'Packets can arrive in a different order. Their numbers tell the computer which order to put them back in.' },
  { prompt: 'One link on the route breaks, but there is another route. What happens to the packets?', options: ['They go the other way', 'They are lost forever', 'They wait until the link is mended'], correct: 0,
    explain: 'Routers send the packets another way, if there is one.' },
], ['Why is it good to split a photo into many small packets, and not send it in one piece?', 'A small packet is quick to send again if it gets lost, and many people can share the cables, taking turns.']));

steps.push(embed('activity-2', 'Activity 2: Send Packets', 'network-builder-3d',
  'Do the missions on the right in order: Messages in Packets, Different Paths, Find Another Way, then the Connect the Town challenge (no help).',
  ['Why watch where each packet goes, and not only whether it arrives?', 'You can see the packets take different routes and arrive in a different order.'], 'lesson=2.2&part=2'));

steps.push(checkStep('check-packets', 'Check: Count Them', 'Type a number for each.', [
  { label: 'A photo is split into packets numbered 1 to 8. Packets 1, 2, 3, 5, 6 and 8 arrive. How many packets are missing?', answer: num(2), feedback: 'Write the numbers 1 to 8. Which ones did not arrive?' },
  { label: 'Ana\'s message goes: Ana, Home router, Router A, Router D, Router B, School router, Ben. How many routers does it pass through?', answer: num(5), feedback: 'Count only the routers. Ana and Ben are laptops.' },
], ['How can the computer at the end tell that a packet has not arrived?', 'The numbers have a gap: a number is not there.']));

steps.push(embed('plenary', 'Plenary: Routers and Packets Drill', 'drill-' + ID,
  'Routers, the internet, routes and packets. Your progress is saved.',
  ['Why does the drill bring back a question you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, category, prompt, answers, distractors, noteText, working) => ({ id, category, prompt, answers, distractors, working, note: noteText });
const cards = [
  card('r-inside', 'router', 'Which joins the laptops inside one classroom?', ['A switch'], ['A router', 'A printer', 'A packet'], 'A switch joins the devices inside one network.', ['Is this one network, or two?', 'Which device has many sockets for the laptops to plug into?']),
  card('r-join', 'router', 'Which joins the home network to the school network?', ['A router'], ['A switch', 'A printer', 'A laptop'], 'A router joins networks together.', ['Is this one network, or two?', 'Which device joins networks to each other?']),
  card('r-none', 'router', 'Home and school each have a network. Nothing joins the two networks. Can Ana at home send Chi at school a message?', ['No'], ['Yes'], 'Nothing joins the networks, so the message cannot get from one to the other.', ['Follow the cables from Ana.', 'Do any cables go to the school network?']),
  card('r-does', 'router', 'What does a router do?', ['It sends and receives data, passing it from one network to another'], ['It prints documents', 'It keeps photos for later', 'It makes the data bigger'], 'A router receives data from one network and sends it on to another.', ['Think of Join Two Networks in the 3D lab.', 'What happened when you added the router?']),
  card('i-what', 'internet', 'What is the internet?', ['Many networks joined to each other'], ['One very big computer', 'One cable round the world', 'A laptop with Wi-Fi'], 'The internet is many networks joined to each other by routers.', ['Think of the home, school and shop networks.', 'What joined them up?']),
  card('i-each', 'internet', 'A home network joins the internet. Which device joins it?', ['Its router'], ['Its printer', 'A laptop', 'A cable on its own'], 'Every network joins the internet through its router.', ['The internet is networks joined together.', 'Which device joins networks?']),
  card('i-far', 'internet', 'No single cable goes from Bangkok to London. How does a message get there?', ['It passes from router to router'], ['It goes in one jump', 'It cannot get there', 'It goes on a USB stick'], 'Each router passes the message on, one step closer, until it arrives.', ['Think of Hop by Hop in the 3D lab.', 'What did each router do with the message?']),
  card('t-count', 'route', 'The route is: Ana, Home router, Router A, Router B, School router, Ben. How many routers?', ['4'], ['6', '3', '2'], 'Home router, Router A, Router B, School router: 4. Ana and Ben are laptops.', ['Count only the routers.', 'Ana and Ben are not routers.']),
  card('t-break', 'route', 'The only route from Ana to Ben has a broken cable in the middle. Can Ana send Ben a message?', ['No'], ['Yes'], 'With the only route broken, the message cannot get past the break.', ['Is there another route?', 'Can data cross a broken cable?']),
  card('t-other', 'route', 'One link breaks, but there is another route. What happens to the packets?', ['They go the other way'], ['They are lost forever', 'They wait until it is mended', 'They go back to the start for ever'], 'Routers send the packets another way, if there is one.', ['Think of Find Another Way in the 3D lab.', 'Was there still a path?']),
  card('p-split', 'packet', 'How does a big photo travel across the internet?', ['Split into small packets'], ['In one big piece', 'On a USB stick', 'As one long cable'], 'Data is split into small packets. Each one travels on its own.', ['Think of Messages in Packets in the 3D lab.', 'What happened to the photo when you sent it?']),
  card('p-why', 'packet', 'One small packet gets lost. Why is that better than losing one big piece?', ['Only that small packet is sent again'], ['The photo gets bigger', 'The router keeps a copy for ever', 'Nothing has to be sent again ever'], 'Only the lost packet needs sending again, not the whole photo.', ['How much has to be sent again?', 'One packet is a small part.']),
  card('p-num', 'packet', 'Why does each packet have a number?', ['So they can be put back in the right order'], ['So they travel faster', 'So they are bigger', 'So the printer can read them'], 'Packets can arrive in a different order. Their numbers put them back in order.', ['Do the packets always arrive in order?', 'What does the computer at the end do with them?']),
  card('p-order', 'packet', 'These packets arrive: 2 "is", 3 "fun", 1 "Coding". What is the message?', ['Coding is fun'], ['is fun Coding', 'fun Coding is', 'Coding fun is'], 'Sort by number: 1 Coding, 2 is, 3 fun.', ['Put the packets in number order.', 'Start with packet 1.']),
  card('p-miss', 'packet', 'Packets numbered 1 to 6 are sent. Packets 1, 2, 4, 5 and 6 arrive. Which packet is missing?', ['3'], ['6', '1', '7'], 'The numbers go 1, 2, then 4: packet 3 is missing.', ['Write the numbers 1 to 6.', 'Which number is not there?']),
];
const drill = { title: 'Year 6, 6.3.2: Joining Networks Together', subtitle: 'Routers, the internet, routes and packets', choiceOnly: true,
  categories: [['router', 'Routers'], ['internet', 'The Internet'], ['route', 'Routes'], ['packet', 'Packets']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 1 && c.working.length === 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
const drillSrc = `// Year 6, 6.3.2: Joining Networks Together. Plenary: routers, the internet, routes and packets.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y6_3_2_iroute.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['7', ' 7 '], ['6', '8', '17']);
ok('do-now-2', 1, ['1'], ['2', '0', '11']);
ok('check-packets', 0, ['2'], ['6', '3']);
ok('check-packets', 1, ['5'], ['7', '4']);
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
{ const bad = /mario|\bIP\b|address|server|website|world wide web|\bwww\b|\bLAN\b|\bWAN\b/i.exec(all);
  assert(!bad, 'term taught later: ' + (bad ? bad[0] + ' in ' + all.slice(Math.max(0, bad.index - 60), bad.index + 30) : '')); }
// each new term is taught on its own slide: nothing before that slide may use it (pictures included)
[['concept-router', /router/i], ['concept-internet', /internet/i], ['concept-route', /\broutes?\b/i], ['concept-packets', /packet/i]].forEach(([at, rx]) => {
  const k = steps.findIndex((s) => s.id === at);
  assert(k > 0, 'slide ' + at);
  const before = JSON.stringify(steps.slice(0, k));
  const m = rx.exec(before);
  assert(!m, rx + ' used before ' + at + ': ' + (m ? before.slice(Math.max(0, m.index - 80), m.index + 20) : ''));
});

const lesson = { id: ID, label: '6.3.2: Joining Networks Together', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after 6.3.1 in the 6.3 unit
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const y6 = data.years.find((y) => y.id === 'year6');
    const u = y6 && y6.units.find((x) => x.lessons.includes(AFTER));
    assert(u, '6.3 unit with ' + AFTER);
    u.lessons.splice(u.lessons.indexOf(AFTER) + 1, 0, ID);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
