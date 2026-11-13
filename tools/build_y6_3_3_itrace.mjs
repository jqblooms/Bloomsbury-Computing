// Builds LessonData/y6-3-3-itrace.json: Year 6, 6.3.3: Addresses and the Web (plan 2.3 iTrace: computers connected to
// the internet have their own address; web pages on the internet are the World Wide Web, and a website can be traced
// to a particular web server).
//   node tools/build_y6_3_3_itrace.mjs
// It writes the plenary drill y6-3-3-itrace and adds the lesson after y6-3-2-iroute in lessons.json.
// Do Now: 6.3.1 and 6.3.2 (follow the cables; packets and routers); the Extension reuses the y6-3-2-iroute drill.
// Activities: Network Builder 3D (pages repo NetLab3D/, registry id network-builder-3d) in lesson mode 2.3,
// part=1 (Every Device Has an Address, Two the Same?, Find and Send: terminals, ipconfig, typed addresses) and part=2 (Visit a Website, Trace a Website, Which Server?,
// Website Down?, Get the School Online).
// Terms taught here, each on its own slide: address (IP address), terminal and ipconfig, web server and website, World Wide Web, trace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y6-3-3-itrace';
const AFTER = 'y6-3-2-iroute';
const P = 'y6-33';
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
const ADDR = (x, y, a) => a ? `<text x="${x}" y="${y}" text-anchor="middle" fill="var(--brand)" font-size="14" font-weight="700" font-family="var(--font-mono, monospace)">${a}</text>` : '';
const LAPTOP = (x, y, name, a) => `<g><rect x="${x - 24}" y="${y - 24}" width="48" height="32" rx="4" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x - 19}" y="${y - 19}" width="38" height="22" rx="2" fill="var(--brand-soft)"/><rect x="${x - 31}" y="${y + 8}" width="62" height="7" rx="3" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text>${ADDR(x, y + 52, a)}</g>`;
const PRINTER = (x, y, a) => `<g><rect x="${x - 15}" y="${y - 28}" width="30" height="15" rx="2" fill="#f4f6fa" stroke="var(--ink-soft)"/><rect x="${x - 28}" y="${y - 15}" width="56" height="28" rx="6" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Printer</text>${ADDR(x, y + 52, a)}</g>`;
const SWITCH = (x, y, name = 'Switch') => `<g><rect x="${x - 46}" y="${y - 14}" width="92" height="28" rx="5" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${x - 38 + i * 10}" y="${y - 5}" width="7" height="7" rx="1" fill="var(--surface)" stroke="var(--brand)"/>`).join('')}<text x="${x}" y="${y + 32}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const ROUTER = (x, y, name = 'Router', a) => `<g><line x1="${x - 20}" y1="${y - 12}" x2="${x - 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><line x1="${x + 20}" y1="${y - 12}" x2="${x + 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><rect x="${x - 34}" y="${y - 12}" width="68" height="24" rx="6" fill="#fde7c7" stroke="#c77700" stroke-width="2"/><circle cx="${x - 20}" cy="${y}" r="3" fill="#2f9e44"/><circle cx="${x - 10}" cy="${y}" r="3" fill="#2f9e44"/><text x="${x}" y="${y + 30}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text>${ADDR(x, y + 48, a)}</g>`;
const SERVER = (x, y, name, a) => `<g><rect x="${x - 22}" y="${y - 34}" width="44" height="64" rx="5" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/>${[0, 1, 2].map((i) => `<rect x="${x - 14}" y="${y - 25 + i * 15}" width="28" height="6" rx="2" fill="var(--brand-soft)" stroke="var(--brand)"/>`).join('')}<circle cx="${x + 10}" cy="${y + 20}" r="3" fill="#2f9e44"/><text x="${x}" y="${y + 50}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text>${ADDR(x, y + 68, a)}</g>`;
const CABLE = (x1, y1, x2, y2, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink-soft)" stroke-width="5" stroke-linecap="round"${dash ? ' stroke-dasharray="2 10"' : ''}/>`;
const BOX = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 5"/><text x="${x + 10}" y="${y + 20}" fill="var(--muted)" font-size="15" font-weight="700">${label}</text>`;
const TAG = (x, y, text) => `<g><rect x="${x - 80}" y="${y - 16}" width="160" height="32" rx="6" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="700" font-family="var(--font-mono, monospace)">${text}</text></g>`;
const ARROW = (x1, y, x2, label) => {
  const r = x2 > x1, tip = r ? x2 : x2, back = r ? x2 - 12 : x2 + 12;
  return `<line x1="${x1}" y1="${y}" x2="${r ? x2 - 10 : x2 + 10}" y2="${y}" stroke="var(--brand)" stroke-width="3"/><path d="M${back} ${y - 7} L${tip} ${y} L${back} ${y + 7} Z" fill="var(--brand)"/>` +
    (label ? `<text x="${(x1 + x2) / 2}" y="${y - 10}" text-anchor="middle" fill="var(--brand)" font-size="15" font-weight="700">${label}</text>` : '');
};
const MARK = (x, y, okMark) => okMark
  ? `<path d="M${x - 14} ${y} L${x - 4} ${y + 11} L${x + 15} ${y - 12}" fill="none" stroke="#2f9e44" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  : `<text x="${x}" y="${y + 12}" text-anchor="middle" fill="#c92a2a" font-size="34" font-weight="800">?</text>`;
const pic = (w, h, inner, caption) => `<figure style="margin:0;text-align:center"><svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;height:auto">${inner}</svg><figcaption style="font-size:15px;color:var(--muted)">${caption}</figcaption></figure>`;
// a trace, as the 3D lab prints it on the laptop's screen
const traceBox = (title, rows) => `<div style="font-family:var(--font-mono, monospace);font-size:17px;background:var(--surface-2);border:1px solid var(--line, var(--muted));border-radius:10px;padding:10px 14px;max-width:420px;margin:0 auto">` +
  `<div style="font-weight:700;margin-bottom:6px">${title}</div>` + rows.map(([n, name, a]) => `<div style="display:flex;gap:10px"><span style="width:22px">${n}.</span><span style="flex:1">${name}</span><span style="color:var(--brand);font-weight:700">${a}</span></div>`).join('') + '</div>';

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, lead, parts, whyQ, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label}</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off" inputmode="decimal"></div>`;
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

// ---------------------------------------------------------------- Do Now 1: follow the cables (6.3.1 and 6.3.2)
const twoNets = pic(480, 290, BOX(10, 10, 250, 270, 'Home') + BOX(360, 10, 110, 270, 'School') +
  CABLE(130, 140, 50, 225) + CABLE(130, 140, 210, 225) + CABLE(130, 140, 310, 140) + CABLE(310, 140, 415, 140) + CABLE(415, 140, 415, 225) +
  SWITCH(130, 140, '') + `<text x="130" y="118" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Switch</text>` + LAPTOP(50, 225, 'Ana') + PRINTER(210, 225) + LAPTOP(190, 60, 'Ben') + ROUTER(310, 140) + SWITCH(415, 140, '') + LAPTOP(415, 225, 'Chi'),
  'Follow the cables');
steps.push(mcStep('do-now', 'Do Now: Follow the Cables (1 of 2)', 'Recap of 6.3.1 and 6.3.2. Look at the cables in the picture.', [
  { prompt: 'Can Ben print on the Printer?', options: ['Yes', 'No'], correct: 1,
    explain: 'Ben has no cable. He is not joined to the switch, so nothing can travel from Ben.' },
  { prompt: 'Can Ana send Chi at school a message?', options: ['Yes', 'No'], correct: 0,
    explain: 'Ana, then the switch, then the router, then the school switch, then Chi. The router joins the two networks.' },
], ['Why does a home network need a router before it can reach the school network?', 'A switch joins devices inside one network. A router joins one network to another.'], twoNets));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: following the cables', steps: [
  { text: '<strong>A similar picture.</strong> At home, Mai and Tom are plugged into a switch. The switch is plugged into a router. Lee is at the library, on a network joined to the same router. Sam has no cable.', visual: note('Mai, Tom: cables to the switch. Switch to router. Router to the library. Sam: no cable.') },
  { text: 'Can Mai print? Start at Mai and follow her cable to the switch.', visual: line('Mai &rarr; ' + kw('Switch')) },
  { text: 'Is the printer plugged into that switch too? Then the data can get there.', visual: line('Mai &rarr; Switch &rarr; ' + kw('Printer')) },
  { text: 'Can Mai send Lee a message? Lee is on another network. Look for a router between the two networks.', visual: line('Mai &rarr; Switch &rarr; ' + kw('Router') + ' &rarr; Library &rarr; Lee') },
  { text: 'Can Sam send anything? Start at Sam. There is no cable to follow, so nothing can leave.', visual: line('Sam &rarr; ' + kw('?')) },
  { text: 'Now look at the Do Now picture. Start at the sender, and follow each cable one step at a time.', visual: note('start at the sender, follow the cables') },
] };

// ---------------------------------------------------------------- Do Now 2: packets and routers (6.3.2)
const DN2 = [2, 4];
steps.push(checkStep('do-now-2', 'Do Now: Packets and Routers (2 of 2)', 'Recap of 6.3.2. Type a number for each.', [
  { label: 'A photo is split into packets numbered 1 to 9. Packets 1, 2, 3, 5, 6, 7 and 9 arrive. How many packets are missing?', answer: num(DN2[0]), feedback: 'Write the numbers 1 to 9. Which ones did not arrive?' },
  { label: 'Ana\'s message goes: Ana, Home router, Router A, Router B, School router, Ben. How many routers does it pass through?', answer: num(DN2[1]), feedback: 'Count only the routers. Ana and Ben are laptops.' },
], ['Why is a photo split into small packets before it crosses the internet?', 'If one small packet is lost, only that one is sent again. And many people can share the cables, taking turns.']));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: packets and routers', steps: [
  { text: '<strong>A similar question.</strong> Packets numbered 1 to 8 are sent. Packets 1, 2, 4, 5, 6, 7 and 8 arrive.', visual: note('sent: 1 to 8') },
  { text: 'Write every number from 1 to 8. Cross out each packet that arrived.', visual: line('1 2 ' + kw('3') + ' 4 5 6 7 8') },
  { text: 'The numbers left are the missing packets. Here only packet 3 is left, so ' + kw('1') + ' packet is missing.', visual: line('missing: ' + kw('1')) },
  { text: '<strong>Routers.</strong> Mai, Home router, Router X, School router, Tom. Mai and Tom are laptops, so do not count them.', visual: line('Home router, Router X, School router') },
  { text: 'Count only the routers.', visual: line(kw('3') + ' routers') },
  { text: 'Now do the Do Now in the same way: cross out what arrived, then count only the routers.', visual: note('cross out, then count') },
] };

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-' + AFTER,
  '<strong>Extension:</strong> finished the Do Now? Try more questions from last lesson. Stuck? Turn on <strong>I need help</strong>.',
  ['Why practise last lesson before we learn something new?', 'Today builds on routers and packets. If you remember them, today is easier.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Finding Things on the Internet',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">6.3 Computer Networks</p><h2 class="lesson-h2">Finding Things on the Internet</h2><p>Year 6</p></div>' +
    facts(['<strong>Today:</strong> how data finds the right computer.', 'Where the pages you look at on the internet come from.', 'Follow data to the right computer in the 3D lab.']) +
    why('There are millions of computers on the internet. Predict: how does a message find the one computer it is for?', 'Each computer has something that is only its own, and the message carries it, so the routers know where to send it.') });

// ---------------------------------------------------------------- address
const addrNet = (names, addrs, caption, tag) => pic(480, 300, CABLE(240, 150, 70, 50) + CABLE(240, 150, 410, 50) + CABLE(240, 150, 70, 210) + CABLE(240, 150, 410, 210) +
  SWITCH(240, 150) + LAPTOP(70, 50, names[0], addrs[0]) + LAPTOP(410, 50, names[1], addrs[1]) + LAPTOP(70, 210, names[2], addrs[2]) + PRINTER(410, 210, addrs[3]) + (tag ? TAG(240, 40, tag) : ''), caption);
steps.push(concept('concept-address', 'Every Device Has an Address',
  'A class has 30 laptops on one network. Ana sends a message to Ben. Predict: how does the network know which laptop is Ben\'s?',
  '<p>Each laptop has its own number. The message carries Ben\'s number, so it goes to Ben and no one else.</p>',
  columns(facts(['Every device on a network has its own <strong>address</strong>: a number, like 192.168.1.3.', 'Data carries the address of the device it is going to.',
    'Switches and routers read the address and send the data the right way.', 'On the internet it is called an <strong>IP address</strong>. Every device on the internet has one.']),
  addrNet(['Ana', 'Ben', 'Chi'], ['192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.9'], 'Ana\'s message carries Ben\'s address', 'To: 192.168.1.3'))));

steps.push(mcStep('predict-address', 'Predict: Who Gets It?', 'Look at the address under each device.', [
  { prompt: 'Ana sends a message to 10.0.0.2. Which device gets it?', options: ['Ben', 'Chi', 'The Printer'], correct: 1,
    explain: 'Chi\'s address is 10.0.0.2, so the message goes to Chi.' },
  { prompt: 'Ben prints. Which address does his data carry?', options: ['10.0.0.7', '10.0.0.8', '10.0.0.5'], correct: 0,
    explain: 'The data carries the address of the device it is going to: the Printer, 10.0.0.7.' },
], ['A pizza is going to a house on a long street. Why does the driver need the house number, not only the street name?', 'Many houses are on one street. The number picks out exactly one house.'],
  addrNet(['Ana', 'Ben', 'Chi'], ['10.0.0.5', '10.0.0.8', '10.0.0.2', '10.0.0.7'], 'Each device has its own address')));

// ---------------------------------------------------------------- the same address twice
const pair = (title, chiAddr, okMark) => pic(300, 230, `<text x="150" y="22" text-anchor="middle" fill="var(--ink)" font-size="17" font-weight="700">${title}</text>` +
  CABLE(150, 150, 60, 70) + CABLE(150, 150, 240, 70) + SWITCH(150, 150) + LAPTOP(60, 70, 'Ben', '192.168.1.3') + LAPTOP(240, 70, 'Chi', chiAddr) +
  TAG(150, 205, 'To: 192.168.1.3') + MARK(268, 190, okMark), okMark ? 'Only Ben has 192.168.1.3' : 'Ben and Chi both have 192.168.1.3');
steps.push(concept('concept-same', 'Compare: Two the Same?',
  'Look at the right picture. Ben and Chi both have the address 192.168.1.3. Predict: a message goes to 192.168.1.3. What happens, and why?',
  '<p>The network cannot tell which laptop the message is for. It may not arrive, or it may go to the wrong laptop.</p>',
  columns(pair('Different addresses', '192.168.1.5', true), pair('The same address', '192.168.1.3', false)) +
  facts(['If two devices have the same address, data cannot tell which one it is for.', 'So every device on a network must have a <strong>different</strong> address, like the houses on a street.'])));

// ---------------------------------------------------------------- terminal and ipconfig
const termPic = `<div style="font-family:var(--font-mono, monospace);font-size:16px;line-height:1.5;background:#0d0f12;color:#e8e8e8;border-radius:10px;padding:10px 14px;max-width:440px;margin:0 auto">` +
  `<div style="color:#8fd18f">C:\\Users\\Ben&gt; <span style="color:#fff">ipconfig</span></div><div>Windows IP Configuration</div><div>Ethernet adapter Ethernet:</div>` +
  `<div style="color:#ffe08a;font-weight:700">&nbsp;&nbsp;&nbsp;IPv4 Address. . . : 192.168.1.23</div></div>` +
  `<p style="margin:6px 0 0;text-align:center;font-size:15px;color:var(--muted)">Ben's terminal after ipconfig</p>`;
steps.push(concept('concept-ipconfig', 'Ask the Computer: ipconfig',
  'In the 3D lab, the screens do not show the addresses. Predict: how could you find out Ben\'s address?',
  '<p>Ask Ben\'s computer. You type a command, and the computer shows its own address.</p>',
  columns(facts(['A <strong>terminal</strong> is a window where you type commands for the computer.', 'Type <strong>ipconfig</strong> and press Enter. The computer shows its IP address on the <strong>IPv4 Address</strong> line.',
    'An IP address is 4 numbers with dots between them. Each number is from 0 to 255.', 'To send to a device, type its address <strong>exactly</strong>.']), termPic)));

steps.push(mcStep('predict-ipconfig', 'Predict: Type the Address', 'Ben typed ipconfig and saw: IPv4 Address 192.168.1.23.', [
  { prompt: 'Ana wants to send Ben a message. What must she type in the Send to box?', options: ['ipconfig', 'Ben', '192.168.1.23'], correct: 2,
    explain: 'The Send to box needs Ben\'s IP address: 192.168.1.23. ipconfig is the command that shows it.' },
  { prompt: 'Ana types 192.168.1.32 by mistake. What happens?', options: ['It still reaches Ben', 'It goes to a different device, or to no device', 'The network fixes the number'], correct: 1,
    explain: 'The network only knows the number she types. 192.168.1.32 is a different address.' },
], ['A phone number has one digit wrong. Why does it ring someone else?', 'Each number belongs to one phone. A different number is a different phone.']));

steps.push(embed('activity-1', 'Activity 1: Every Device Has an Address', 'network-builder-3d',
  'Do the missions on the right in order: Every Device Has an Address, Two the Same?, then the Find and Send challenge (no help). Walk up to a computer and press <strong>T</strong> to open its terminal.',
  ['Why send a message before you give Chi a new address?', 'You see it fail first. Then you know the address was the problem.'], 'lesson=2.3&part=1'));

// ---------------------------------------------------------------- web server
const serverPic = pic(560, 230, CABLE(50, 120, 170, 120) + CABLE(170, 120, 300, 120) + CABLE(300, 120, 470, 120) +
  ARROW(70, 40, 450, 'Asks for the page') + ARROW(450, 215, 70, '') + `<text x="260" y="210" text-anchor="middle" fill="var(--brand)" font-size="15" font-weight="700">Sends the page back</text>` +
  LAPTOP(50, 120, 'Ana') + ROUTER(170, 120, 'Home') + ROUTER(300, 120, 'Router A') + SERVER(470, 112, 'Web server', '203.0.113.7'),
  'www.cats.example is kept on this web server');
steps.push(concept('concept-server', 'Where Is a Website Kept?',
  'You open a website about cats. It is not saved on your laptop. Predict: where do its pages come from?',
  '<p>From another computer, far away on the internet. It keeps the pages and sends them to anyone who asks.</p>',
  facts(['A <strong>website</strong>, like www.cats.example, is kept on a <strong>web server</strong>.', 'A web server is a computer on the internet. It has its own address.',
    'Your laptop asks the web server for a page. The web server sends the page back, in packets, router to router.']) + serverPic));

// ---------------------------------------------------------------- internet or web?
const inetPic = pic(300, 150, CABLE(40, 80, 150, 80) + CABLE(150, 80, 260, 80) + ROUTER(40, 80, '') + ROUTER(150, 80, '') + ROUTER(260, 80, ''),
  'The internet: networks joined by routers');
const webPic = pic(300, 150, SERVER(60, 60, '', '') + SERVER(150, 60, '', '') + SERVER(240, 60, '', '') +
  `<text x="150" y="130" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">web pages on web servers</text>`, 'The World Wide Web: all the web pages');
steps.push(concept('concept-www', 'The Internet and the Web',
  'People say "the internet" and "the web" as if they mean the same thing. Predict: are they the same? Why, or why not?',
  '<p>No. The internet is the networks and routers that carry data. The web is the web pages on web servers. The internet carries the web pages to you.</p>',
  columns(facts(['The <strong>World Wide Web</strong> (the web) is all the web pages kept on web servers.', 'The <strong>internet</strong> is the networks joined by routers. It carries the web pages to you.',
    'The internet carries other things too, like messages and video calls.']), inetPic + webPic)));

steps.push(mcStep('predict-web', 'Predict: Internet or Web?', '', [
  { prompt: 'Which is the World Wide Web?', options: ['All the networks joined by routers', 'All the web pages kept on web servers', 'One very big computer'], correct: 1,
    explain: 'The web is the web pages. The networks and routers are the internet.' },
  { prompt: 'What carries a web page from the web server to your laptop?', options: ['The internet: routers pass it on', 'The World Wide Web', 'The web server\'s screen'], correct: 0,
    explain: 'The page travels in packets across the internet, router to router.' },
  { prompt: 'You open www.games.example. Where do its pages come from?', options: ['Your laptop\'s keyboard', 'The Wi-Fi point', 'A web server'], correct: 2,
    explain: 'Websites are kept on web servers. Your laptop asks, and the server sends the pages.' },
], ['Roads and shops: why are the roads not the same thing as the shops?', 'The roads carry you to the shops. The shops hold the things you want.']));

// ---------------------------------------------------------------- trace
const catsTrace = traceBox('Trace route to www.cats.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router B', '81.2.3.2'], [4, 'Web server', '203.0.113.7']]);
steps.push(concept('concept-trace', 'Trace a Website',
  'A website is slow to open. Predict: how could you find out which way its data goes, and where it comes from?',
  '<p>List every router on the way, one at a time, until you reach the computer that keeps the website.</p>',
  columns(facts(['A <strong>trace</strong> lists each hop on the way to a website: every router, then its web server.', 'Each hop shows its address.',
    'The last hop is the web server that keeps the website.', 'Different websites can be kept on different web servers, with different addresses.']), catsTrace)));

const gamesTrace = traceBox('Trace route to www.games.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router C', '81.2.3.3'], [4, 'Web server', '198.51.100.4']]);
steps.push(mcStep('predict-trace', 'Predict: Read the Trace', 'Read the trace.', [
  { prompt: 'What is the address of the web server that keeps www.games.example?', options: ['81.2.3.3', '198.51.100.4', '192.168.1.1'], correct: 1,
    explain: 'The last hop is the web server: 198.51.100.4. The others are routers.' },
  { prompt: 'How many routers are on the way to the web server?', options: ['3', '4', '5'], correct: 0,
    explain: 'Home router, Router A, Router C: 3 routers. Hop 4 is the web server, not a router.' },
], ['Why might two websites have traces that end at different addresses?', 'Each website can be kept on its own web server, and each web server has its own address.'], gamesTrace));

steps.push(embed('activity-2', 'Activity 2: Trace a Website', 'network-builder-3d',
  'Do the missions on the right in order: Visit a Website (find the web server\'s address with ipconfig first), Trace a Website, Which Server?, Website Down?, then the Get the School Online challenge (no help).',
  ['Why trace a website, and not only open it?', 'Opening it only shows the page. The trace shows the way it came and which web server keeps it.'], 'lesson=2.3&part=2'));

const CHK = { routers: 4, server: '192.0.2.10' };
const newsTrace = traceBox('Trace route to www.news.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router B', '81.2.3.2'], [4, 'Router D', '81.2.3.4'], [5, 'Web server', CHK.server]]);
steps.push(checkStep('check-trace', 'Check: Read a Trace', 'Read the trace, then type your answers.', [
  { label: 'How many routers are on the way to the web server?', answer: num(CHK.routers), feedback: 'Count only the routers. The last hop is not a router.' },
  { label: 'Type the address of the web server that keeps www.news.example.', answer: '^\\s*192\\.0\\.2\\.10\\s*$', feedback: 'Which hop is the web server? Copy its address exactly, dots and all.' },
], ['Why does a trace show an address for every hop, and not only a name?', 'Data finds each device by its address, so the address shows exactly which device the data went through.'], newsTrace));

steps.push(embed('plenary', 'Plenary: Addresses and the Web Drill', 'drill-' + ID,
  'Addresses, web servers, the World Wide Web and traces. Your progress is saved.',
  ['Why does the drill bring back a question you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, category, prompt, answers, distractors, noteText, working) => ({ id, category, prompt, answers, distractors, working, note: noteText });
const cards = [
  card('a-what', 'address', 'What does every device on a network have, so data can find it?', ['Its own address'], ['Its own printer', 'Its own web server', 'Its own switch'], 'Every device has its own address. Data carries the address of the device it is going to.', ['Think of Every Device Has an Address in the 3D lab.', 'What was under each name on the screens?']),
  card('a-who', 'address', 'Ben is 10.0.0.8. Chi is 10.0.0.2. A message goes to 10.0.0.2. Who gets it?', ['Chi'], ['Ben', 'Both of them', 'Nobody'], 'The message goes to the device with that address: Chi.', ['Match the address on the message.', 'Whose address is 10.0.0.2?']),
  card('a-ip', 'address', 'What is an address on the internet called?', ['An IP address'], ['A web server', 'A packet number', 'A router name'], 'Every device on the internet has an IP address.', ['It is a number for each device.', 'It has two letters before the word address.']),
  card('a-same', 'address', 'Ben and Chi both have 192.168.1.3. A message goes to 192.168.1.3. What happens?', ['The network cannot tell which one it is for'], ['Ben gets it, because he was first', 'Chi gets it, because she is newer', 'It goes to both, much faster'], 'Two devices with one address: the network cannot tell which one the data is for.', ['Think of Two the Same? in the 3D lab.', 'What happened when Ana sent to Ben?']),
  card('a-fix', 'address', 'Ana is 192.168.1.2 and the Printer is 192.168.1.9. Which new address can Chi have?', ['192.168.1.6'], ['192.168.1.2', '192.168.1.9'], 'Chi needs an address no other device has. 192.168.1.2 and 192.168.1.9 are taken.', ['Which addresses are taken already?', 'Pick one no other device has.']),
  card('a-cmd', 'address', 'Which command shows a computer\'s IP address?', ['ipconfig'], ['print', 'send', 'open'], 'Type ipconfig in the terminal. The IPv4 Address line is the address.', ['Think of the terminal in the 3D lab.', 'What did you type before you saw the address?']),
  card('a-bad', 'address', 'Why is 192.168.1.300 not a real IP address?', ['A number is bigger than 255'], ['It has too many dots', 'It has letters in it', 'It is too short'], 'Each of the 4 numbers is from 0 to 255, and 300 is bigger than 255.', ['How many numbers, and how big can each one be?', 'Look at the last number.']),
  card('a-typo', 'address', 'Ana means to type Ben\'s address, but gets one number wrong. What happens?', ['It goes to a different device, or to no device'], ['It still reaches Ben', 'The network fixes the number'], 'The network only knows the number she types. A different number is a different address.', ['Think of Find and Send in the 3D lab.', 'Does the network know who Ana meant?']),
  card('s-where', 'server', 'Where is a website kept?', ['On a web server'], ['On your keyboard', 'Inside the Wi-Fi point', 'In every router'], 'Websites are kept on web servers, computers on the internet.', ['Think of Visit a Website in the 3D lab.', 'Where did the page come from?']),
  card('s-what', 'server', 'What does a web server do?', ['Sends web pages to anyone who asks'], ['Joins the laptops in one classroom', 'Prints every web page it keeps', 'Splits the routers into packets'], 'A web server keeps web pages and sends them to anyone who asks.', ['Your laptop asks it for a page.', 'What does it send back?']),
  card('s-back', 'server', 'How does a web page travel from the web server to your laptop?', ['In packets, router to router'], ['In one jump through the air', 'On a USB stick', 'Through the printer'], 'The page is split into packets that cross the internet router to router.', ['Think of last lesson: how does data cross the internet?', 'What passes it on, one step at a time?']),
  card('w-what', 'web', 'What is the World Wide Web?', ['All the web pages kept on web servers'], ['All the networks joined by routers', 'One very big computer in America', 'A long cable round the world'], 'The web is the web pages. The internet carries them.', ['Think of Internet or Web? in the lesson.', 'Is it the pages, or the networks?']),
  card('w-inet', 'web', 'What is the internet?', ['Many networks joined by routers'], ['All the web pages', 'One website', 'One web server'], 'The internet is networks joined by routers, all round the world.', ['Is it the pages, or the networks?', 'Which joins networks together?']),
  card('w-carry', 'web', 'What carries web pages to your laptop?', ['The internet'], ['The World Wide Web', 'The printer', 'The keyboard'], 'The internet carries the web pages, router to router.', ['The web is the pages themselves.', 'What carries them?']),
  card('w-same', 'web', 'Are the internet and the World Wide Web the same thing?', ['No: the internet carries the web pages'], ['Yes: they are two names for one thing'], 'The internet is the networks. The web is the pages it carries.', ['Think of roads and shops.', 'Which one carries, and which one holds the pages?']),
  card('t-what', 'trace', 'What does a trace show?', ['Each router on the way to the web server, with its address'], ['Every password typed on the way to the website', 'How many people visited the website today', 'How big each web page on the website is'], 'A trace lists each hop: every router, then the web server, with each address.', ['Think of Trace a Website in the 3D lab.', 'What did Ana\'s screen list?']),
  card('t-last', 'trace', 'Trace: 1. Home router 192.168.1.1, 2. Router A 81.2.3.1, 3. Web server 203.0.113.7. What is the web server\'s address?', ['203.0.113.7'], ['192.168.1.1', '81.2.3.1'], 'The last hop is the web server: 203.0.113.7.', ['Which hop is the web server?', 'Look at the last hop.']),
  card('t-count', 'trace', 'Trace: 1. Home router, 2. Router A, 3. Router B, 4. Router C, 5. Web server. How many routers?', ['4'], ['5', '3', '6'], 'Home router, Router A, Router B, Router C: 4. Hop 5 is the web server.', ['Count only the routers.', 'The last hop is not a router.']),
  card('t-diff', 'trace', 'Two websites\' traces end at different addresses. Why?', ['They are kept on different web servers'], ['One of the websites is broken', 'The routers changed their names', 'They are both saved on your laptop'], 'Each web server has its own address, so traces to different servers end in different places.', ['Think of Which Server? in the 3D lab.', 'What is at the end of a trace?']),
  card('t-down', 'trace', 'A cable on the way to a web server breaks, but there is another path. Does the website still open?', ['Yes, the data goes another way'], ['No, never again', 'Only on Wi-Fi'], 'Routers send the data another way, if there is one.', ['Think of Website Down? in the 3D lab.', 'Is there still a path?']),
];
const drill = { title: 'Year 6, 6.3.3: Addresses and the Web', subtitle: 'Addresses, web servers, the World Wide Web and traces', choiceOnly: true,
  categories: [['address', 'Addresses'], ['server', 'Web Servers'], ['web', 'Internet and Web'], ['trace', 'Traces']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 1 && c.working.length === 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
const drillSrc = `// Year 6, 6.3.3: Addresses and the Web. Plenary: addresses, web servers, the World Wide Web and traces.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y6_3_3_itrace.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['2', ' 2 '], ['4', '3', '12']);
ok('do-now-2', 1, ['4'], ['6', '5', '14']);
ok('check-trace', 0, ['4'], ['5', '3']);
ok('check-trace', 1, ['192.0.2.10', ' 192.0.2.10 '], ['81.2.3.4', '192.0.2.1', '192.0.2.100', '192x0x2x10', '19202.10']);
// the Do Now walkthroughs never highlight the Do Now's own answers
steps.filter((s) => s.walkthrough).forEach((s) => {
  const hl = JSON.stringify(s.walkthrough).match(/wt-hl\\?">([^<]*)</g) || [];
  hl.forEach((h) => assert(!DN2.some((n) => new RegExp('>' + n + '<').test(h)), 'walkthrough highlights a Do Now answer: ' + h));
  assert(!/\b(Ana|Ben|Chi)\b/.test(JSON.stringify(s.walkthrough.steps)), 'walkthrough uses the Do Now names');
});
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/mario|\bURL\b|\bLAN\b|\bWAN\b|\bDNS\b/i.test(all), 'a term this lesson does not teach');
// each new term is taught on its own slide: nothing before that slide may use it (pictures included)
[['concept-address', /address|\bIP\b/i], ['concept-ipconfig', /ipconfig|terminal/i], ['concept-server', /server|website/i], ['concept-www', /world wide web|web page|\bthe web\b(?! server)/i], ['concept-trace', /trac(e|ing)/i]].forEach(([at, rx]) => {
  const k = steps.findIndex((s) => s.id === at);
  assert(k > 0, 'slide ' + at);
  const before = JSON.stringify(steps.slice(0, k));
  const m = rx.exec(before);
  assert(!m, rx + ' used before ' + at + ': ' + (m ? before.slice(Math.max(0, m.index - 80), m.index + 20) : ''));
});

const lesson = { id: ID, label: '6.3.3: Addresses and the Web', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after 6.3.2 in the 6.3 unit
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
