// Builds LessonData/y10-2-3-l2.json: Year 10, 2.3 L2: Asymmetric Encryption (syllabus 0478 2.3 2: how data is
// encrypted using symmetric and asymmetric encryption; notes: asymmetric encryption includes the use of public and
// private keys). It also writes the lesson's four drills and registers the lesson after y10-2-3-l1 in the 2.3 unit.
//   node tools/build_y10_2_3_l2.mjs
// Same shape as tools/build_y10_2_3_l1.mjs: EAL-light, every slide's core question a WHY (Term 1b), a teacher-only
// Think, Pair, Share under every heading, predict-then-reveal, compare slides.
// L1 ended on "sharing the key is the weak point". This lesson answers it: anyone can encrypt with the public key,
// only the private key decrypts, so the key that decrypts is never sent.
// Do Now: 0478/11 June 2025 Q6(a), first four gaps (adapted: the stem and list leave out the asymmetric terms), and
// 0478/12 March 2024 Q7(b)(i) and (ii), each with a Walk me through it. Extension drill y10-2-3-l2-ext (Topic 2 so far).
// Exam questions: 0478/11 June 2024 Q7, 0478/11 June 2025 Q6(a) last four gaps and Q6(b), 0478/13 November 2024
// Q2(g)(i) to (iii), 0478/12 March 2024 Q7(a)(ii), 0478/11 November 2025 Q2(e)(ii).
// Activities: y10-2-3-l2-keys (which key, who can read it) and y10-2-3-l2-compare (symmetric or asymmetric?).
// Plenary drill: y10-2-3-l2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-3-l2';
const P = 'y10-23l2';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

const pill = (t, tone = '') => `<span style="display:inline-block;padding:7px 12px;border-radius:8px;background:var(--surface-3);font-weight:700;${tone === 'bad' ? 'color:var(--bad);border:2px solid var(--bad-line)' : tone === 'brand' ? 'border:2px solid var(--brand)' : tone === 'good' ? 'color:var(--good);border:2px solid var(--good-line)' : ''}">${t}</span>`;
const arrow = '<b style="margin:0 6px">&rarr;</b>';
const flow = (...parts) => `<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px">${parts.join(arrow)}</div>`;
const chips = (words) => '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">' + words.map((w) =>
  `<span style="padding:4px 10px;border-radius:6px;background:var(--surface-3);font-size:15px">${w}</span>`).join('') + '</div>';
const gap = (n) => `<b>(${n})</b>&nbsp;<span style="display:inline-block;min-width:70px;border-bottom:2px solid var(--ink-2, currentColor)">&nbsp;</span>`;
const para = (t) => `<p style="margin:6px 0;font-size:17px;line-height:1.7">${t}</p>`;
const col = (title, rows, verdict, tone) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` +
  `<p style="margin:0;font-size:17px;line-height:1.6">${rows.join('<br>')}</p><p style="margin:8px 0 0;text-align:center">${pill(verdict, tone)}</p></div>`;
const twoCols = (a, b) => `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">${a}${b}</div>`;

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, heading, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
function selfMarked(id, label, heading, lead, items, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t) => `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div>`;
const wtList = (hl = []) => chips(['packets', 'network', 'header', 'binary'].map((w) => hl.includes(w) ? kw(w) : w));
const packet = (hlAt = -1, names = ['header', 'payload', 'trailer']) => '<div style="display:flex;gap:4px">' + names.map((t, i) =>
  `<span${i === hlAt ? ' class="wt-hl"' : ''} style="flex:${i === 1 ? 2 : 1};padding:10px;border-radius:8px;background:var(--surface-3);text-align:center;font-weight:700">${t}</span>`).join('') + '</div>';

// Do Now 1 (gap fill from a list, 2.3 L1). A similar paragraph about packets is filled step by step; the last gap of
// the slide is worked as a method: find the describing words in the list and test each one.
const WT_GAPS = { title: 'Walk me through it: filling the gaps', steps: [
  { text: '<strong>A similar question.</strong> Fill the gaps from the list.', visual: para(`Data is broken into ${gap(1)} . Each one is sent across a ${gap(2)} .`) + wtList() },
  { text: 'Read the whole paragraph first. Do not fill any gap yet.', visual: note('read it all first') },
  { text: 'For each gap, ask: does it need a thing, or a describing word?', visual: stmt('broken into <strong>a thing</strong>') + stmt('sent across <strong>a thing</strong>') },
  { text: 'Gap 1: data is broken into small parts. In the list, that is packets. Cross it off.', visual: wtList(['packets']) },
  { text: 'Gap 2: the packets are sent across something. That is network.', visual: wtList(['packets', 'network']) },
  { text: 'Read the paragraph again with the words in. It must make sense.', visual: para(`Data is broken into ${kw('packets')} . Each one is sent across a ${kw('network')} .`) },
  { text: 'For your question, gap 4 needs a describing word for scrambled data. Find the describing words in the list. Test each one in the sentence, and keep the one the exam uses for data with no meaning.', visual: note('test each describing word') },
] };

// Do Now 2 (packet header and router, 2.1 L1). The header items are worked as a parcel label, stopping before the
// items; the router as a sat nav at a junction; the why part as three friends going home, stopping before the answer.
const WT_HEADER = { title: 'Walk me through it: the packet header', steps: [
  { text: '<strong>A similar question.</strong> A parcel is sent in three boxes. Name two things written on each label.', visual: stmt('Label: ? and ?') },
  { text: 'The van driver never opens a box. Everything needed is written on the outside.', visual: note('read the outside only') },
  { text: 'Who is it for? The label says: <strong>To: 12 Hill Road</strong>. The driver needs this first.', visual: stmt(kw('To: 12 Hill Road')) + stmt('From: ?') + stmt('Box ? of 3') },
  { text: 'Who sent it, in case it must go back? <strong>From: 4 Park Lane</strong>. Which box is it? <strong>Box 2 of 3</strong>, so the boxes can be put in order.', visual: stmt('To: 12 Hill Road') + stmt(kw('From: 4 Park Lane')) + stmt(kw('Box 2 of 3')) },
  { text: 'A packet header is the label of a packet. It holds the same three kinds of thing. Give two of them, in network words, for part (a).', visual: packet(0, ['header: ?', 'payload', 'trailer']) },
  { text: '<strong>The router.</strong> A different case: a sat nav reads where you want to end up. At every junction it picks the next road for you.', visual: flow(pill('Start'), pill('junction', 'brand'), pill('junction', 'brand'), pill('End')) },
  { text: 'A router does that job for each packet, at each junction of the network. Write that job for part (b).', visual: note(kw('at each junction')) },
  { text: '<strong>Why a different order?</strong> A different case: three friends leave school at 3 pm. One takes the main road, one the park, one the bus.', visual: stmt('Main road: busy today') + stmt('Park: quiet') + stmt('Bus: stops a lot') },
  { text: 'They each went by a different road, and some roads are slower. So they get home in a different order from the one they left in. Use the same idea for part (c).', visual: note('each by its own road') },
] };

// ---------------------------------------------------------------- Do Now and its extension
// 0478/11 June 2025 Q6(a), first four gaps. Mark scheme: algorithm; plain text; cipher text; meaningless. The paper's
// stem says the paragraph is about asymmetric encryption and its list includes the two key words; both are left out
// here (taught later in this lesson) and the last four gaps are on the exam-gaps-2 slide.
const LIST_1 = ['algorithm', 'binary', 'cipher text', 'compression', 'error', 'hardware', 'hexadecimal', 'meaningless', 'plain text', 'readable', 'transmission', 'unreadable'];
steps.push(checkStep('do-now', 'Do Now: Encryption Words (1 of 2)', 'Do Now: Encryption Words (1 of 2)',
  'From 2.3 L1. Adapted from ' + cite('0478/11, June 2025, Question 6(a)') + ' Use terms from the list. Some will not be used.', [
    { label: 'Gap 1', answer: '^\\s*(an?\\s+)?algorithms?\\s*\\.?\\s*$', feedback: 'Which word in the list is a set of steps?' },
    { label: 'Gap 2', answer: '^\\s*(the\\s+)?plain\\s*-?\\s*text\\s*\\.?\\s*$', feedback: 'What goes in, before it is scrambled?' },
    { label: 'Gap 3', answer: '^\\s*(the\\s+)?(ciph|cyph)er\\s*-?\\s*text\\s*\\.?\\s*$', feedback: 'What comes out, after it is scrambled?' },
    { label: 'Gap 4', answer: '^\\s*meaningless\\s*\\.?\\s*$', feedback: 'Use the word from the list that the exam uses for scrambled data.' },
  ], ['Why can you not decide a gap by looking at that gap alone?', 'The words around a gap say what kind of word fits.'],
  para(`Data is encrypted using an encryption key. This is a type of ${gap(1)} that scrambles the ${gap(2)} and turns it into ${gap(3)} . This makes the data ${gap(4)} .`) + chips(LIST_1)));
steps[steps.length - 1].walkthrough = WT_GAPS;

// 0478/12 March 2024 Q7(b)(i): any two from destination address/IP, sender address/IP, packet number.
// Q7(b)(ii): any one from control the route the packet takes; send each packet towards its destination; choose a more
// efficient route. Part (d) is not from the paper.
steps.push(checkStep('do-now-2', 'Do Now: Packets (2 of 2)', 'Do Now: Packets (2 of 2)',
  'From 2.1 L1. Parts (a) and (b): ' + cite('0478/12, March 2024, Question 7(b)(i) and (ii)') + ' The data is transmitted using packet switching.', [
    { marks: 2, label: 'Identify two items of data contained in a packet header.',
      answer: '^(?!.*\\bpayload\\b)(?:(?=.*\\b(destination|receiver\\W?s?|recipient\\W?s?)\\b)(?=.*\\b(sender\\W?s?|senders|source|origin\\w*|from)\\b)(?=.*\\b(address\\w*|ip)\\b)|(?=.*\\b(destination|receiver\\W?s?|recipient\\W?s?)\\b)(?=.*\\b(address\\w*|ip)\\b)(?=.*(\\b(packet|sequence)\\W?s?\\s+(number|no)\\b|\\bnumber\\s+of\\s+(the\\s+|each\\s+)?packet))|(?=.*\\b(sender\\W?s?|senders|source|origin\\w*|from)\\b)(?=.*\\b(address\\w*|ip)\\b)(?=.*(\\b(packet|sequence)\\W?s?\\s+(number|no)\\b|\\bnumber\\s+of\\s+(the\\s+|each\\s+)?packet))).*$',
      feedback: 'Two items: think about what a router needs, and what the receiver needs to rebuild the file.' },
    { label: 'Give the purpose of a router in the packet-switching process.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(route[sd]?|routing|paths?|forward\\w*|direct\\w*|destination|towards|next\\s+(device|router|hop|node)|way)\\b).*$',
      feedback: 'What does a router decide for each packet?' },
    { line: true, label: 'Why can packets of one file arrive in a different order?',
      answer: '^(?=.*\\b(routes?|paths?|ways?)\\b)(?=.*\\b(different|own|separate\\w*|independent\\w*|various|longer|shorter|slower|faster|busier|quicker|another|each|many|other)\\b).*$',
      feedback: 'How do the packets cross the network?' },
  ], ['Why is a file sent as many small packets, not one big block?', 'If one packet is lost, only that packet is sent again.']));
steps[steps.length - 1].walkthrough = WT_HEADER;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-3-l2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1 Data Transmission, 2.2 Methods of Error Detection and 2.3 L1 Symmetric Encryption. Stuck? Switch on <strong>I need help</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Asymmetric Encryption',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.3 Encryption</p><h2 class="lesson-h2">Asymmetric Encryption</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> how <strong>two different keys</strong> fix the weak point of symmetric encryption.', '<strong>You already know:</strong> plain text, cipher text, the key, and symmetric encryption with <strong>one shared key</strong>.']) +
    why('Last lesson ended on a weak point of symmetric encryption. What was it, and why does it matter?', 'The key has to be shared. If it is intercepted on the way, whoever has it can decrypt every message.') });

// ---------------------------------------------------------------- the problem: people who have never met
steps.push({ id: 'concept-problem', label: 'The Problem: People Who Have Never Met',
  content: '<h2 class="lesson-h2">The Problem: People Who Have Never Met</h2>' +
    tps('Predict: Ana buys from a shop in another country. She has never met anyone there. How can they agree a symmetric key that Eve never sees? Why is that hard?',
      '<p>They cannot meet in person, so the key must be <strong>sent</strong> across the network.</p><p>Anything sent can be <strong>intercepted</strong>. If Eve gets the key, she can decrypt everything.</p>', 'Show the worked answer') +
    columns(facts(['Symmetric: the <strong>same key</strong> encrypts and decrypts, so the receiver must be <strong>sent</strong> the key.', 'We send data to shops, banks and websites we have <strong>never met</strong>.', 'Any key sent across a network can be <strong>intercepted</strong>.', 'Today\'s question: can we encrypt with a key that is <strong>safe to send</strong>?']),
      '<div style="display:grid;gap:12px;text-align:center">' + flow(pill('Ana'), pill('key ?', 'brand'), pill('Shop')) +
      `<div>${pill('Eve intercepts everything sent', 'bad')}</div>` + `<div>${pill('No safe way to send the key', 'bad')}</div></div>`) });

// ---------------------------------------------------------------- the idea: an open padlock
steps.push({ id: 'concept-padlock', label: 'A Padlock Anyone Can Close',
  content: '<h2 class="lesson-h2">A Padlock Anyone Can Close</h2>' +
    tps('Predict: Ben posts open padlocks to anyone who asks. He keeps the only key. Ana locks a box for Ben with one. Eve has a padlock too. Can Eve open the box? Why?',
      '<p><strong>No.</strong> A padlock closes without a key, but only Ben\'s key opens it.</p><p>Having a padlock lets Eve <strong>lock</strong> boxes, not <strong>open</strong> them.</p>', 'Show the worked answer') +
    columns(facts(['<strong>Anyone</strong> can close an open padlock. Closing needs no secret.', 'Only the <strong>key</strong> opens it, and Ben never sends his key.', 'So it does not matter who sees the padlock on the way.', 'Next: the same idea with two encryption keys.']),
      '<div style="display:grid;gap:10px;text-align:center">' +
      flow(pill('Ben'), pill('open padlock', 'brand'), pill('Ana')) + `<div>${pill('Eve sees the padlock: no problem', 'good')}</div>` +
      flow(pill('Ana locks the box'), pill('locked box'), pill('Ben opens it with his key', 'good')) + `<div>${pill('Eve sees the locked box: cannot open it', 'good')}</div></div>`) });

// ---------------------------------------------------------------- concept: public key and private key
steps.push({ id: 'concept-asymmetric', label: 'Asymmetric Encryption: Public Key and Private Key',
  content: '<h2 class="lesson-h2">Asymmetric Encryption: Public Key and Private Key</h2>' +
    tps('Predict: Ben sends his public key to Ana. Eve copies it on the way. Can Eve decrypt Ana\'s message to Ben? Why?',
      '<p><strong>No.</strong> The public key only <strong>encrypts</strong>. It cannot decrypt.</p><p>Decrypting needs Ben\'s <strong>private key</strong>, and that never left Ben\'s computer.</p>', 'Show the worked answer') +
    columns(facts(['<strong>Asymmetric</strong> encryption uses <strong>two different keys</strong>: a <strong>public key</strong> and a <strong>private key</strong>.', 'Ben makes both keys. They work together.', 'The <strong>public key encrypts</strong>. Ben gives it to anyone, even Eve.', 'The <strong>private key decrypts</strong>. Ben keeps it. It is <strong>never sent</strong>.', 'Data encrypted with Ben\'s public key can only be decrypted with Ben\'s private key.']),
      '<div style="display:grid;gap:10px;text-align:center">' +
      flow(pill('Ben'), pill("Ben's public key", 'brand'), pill('Ana')) +
      flow(pill('plain text'), pill("Ben's public key", 'brand'), pill('cipher text')) +
      flow(pill('cipher text'), pill("Ben's private key", 'good'), pill('plain text')) +
      `<div>${pill("Eve has the public key and the cipher text: meaningless", 'bad')}</div></div>`) });

// 0478/11 June 2024 Q7. Mark scheme, one mark for each term in the correct place: plain text; cipher text; public key;
// private key.
const LIST_2 = ['asymmetric', 'certificate', 'cipher text', 'decrypted', 'encrypted', 'parallel key', 'plain text', 'private key', 'protected', 'public key', 'serial key', 'symmetric'];
steps.push(checkStep('exam-gaps', 'Exam Question: Complete the Paragraph', 'Exam Question: Complete the Paragraph',
  cite('0478/11, June 2024, Question 7') + ' Data is encrypted to keep it safe during transmission. Complete the paragraph about asymmetric encryption. Use the terms from the list. Some of the terms will not be used. You should only use a term once.', [
    { label: 'Gap 1', answer: '^\\s*(the\\s+)?plain\\s*-?\\s*text\\s*\\.?\\s*$', feedback: 'What is the data called before it is encrypted?' },
    { label: 'Gap 2', answer: '^\\s*(the\\s+)?(ciph|cyph)er\\s*-?\\s*text\\s*\\.?\\s*$', feedback: 'What is the data called after it is encrypted?' },
    { label: 'Gap 3', answer: '^\\s*(a\\s+|the\\s+)?public(\\s*-?\\s*key)?\\s*\\.?\\s*$', feedback: 'Which key can anyone have?' },
    { label: 'Gap 4', answer: '^\\s*(a\\s+|the\\s+)?private(\\s*-?\\s*key)?\\s*\\.?\\s*$', feedback: 'Which key does only the receiver have?' },
  ], ['Why does an exam list include words like symmetric and serial key that are not used?', 'The wrong words are there on purpose. You must know what each word means, not just pick one that sounds familiar.'],
  para(`${gap(1)} is encrypted into ${gap(2)} using a ${gap(3)} . The encrypted data is then transmitted from the sender to the receiver. The encrypted data is then decrypted using a ${gap(4)} .`) + chips(LIST_2)));

// ---------------------------------------------------------------- compare: Eve intercepts the key that is sent
steps.push({ id: 'compare-intercept', label: 'Compare: Eve Intercepts the Key',
  content: '<h2 class="lesson-h2">Compare: Eve Intercepts the Key</h2>' +
    tps('Both times, Eve intercepts the key that is sent and then the cipher text. Predict: in which case can she read the message? Why?',
      '<p>Left: the key that was sent also <strong>decrypts</strong>, so Eve reads the message.</p><p>Right: the key that was sent only <strong>encrypts</strong>. The key that decrypts was never sent.</p>') +
    twoCols(col('Symmetric', ['Ana sends Ben the shared key.', 'Eve intercepts: <strong>the key + cipher text</strong>', 'The same key decrypts.'], 'Eve reads it', 'bad'),
      col('Asymmetric', ["Ben sends Ana his public key.", 'Eve intercepts: <strong>public key + cipher text</strong>', 'The public key cannot decrypt.'], 'Meaningless to Eve', 'good')) +
    facts(['Eve intercepted everything that was sent, both times.', 'Asymmetric never sends the key that <strong>decrypts</strong>.']) });

// ---------------------------------------------------------------- compare: the right public key and the wrong one
steps.push({ id: 'compare-whose', label: "Compare: Ben's Public Key and Chen's Public Key",
  content: '<h2 class="lesson-h2">Compare: Ben\'s Public Key and Chen\'s Public Key</h2>' +
    tps("Ana writes to Ben. The first time she encrypts with Ben's public key. The second time she uses Chen's public key by mistake. Predict: can Ben read each one? Why?",
      "<p>First: <strong>yes</strong>. Ben's private key matches Ben's public key.</p><p>Second: <strong>no</strong>. Only Chen's private key can decrypt it, and only Chen has that.</p>") +
    twoCols(col("Encrypted with Ben's public key", ['Sent to Ben.', "Ben uses <strong>Ben's private key</strong>.", 'The keys match.'], 'Ben reads it', 'good'),
      col("Encrypted with Chen's public key", ['Sent to Ben.', "Ben uses <strong>Ben's private key</strong>.", 'The keys do not match.'], 'Meaningless to Ben', 'bad')) +
    facts(['Everyone has their <strong>own</strong> public key and private key.', 'Encrypt with the public key of the person who will <strong>read</strong> the message.']) });

// ---------------------------------------------------------------- check: which key?
steps.push(mcStep('check-keys', 'Check: Which Key?', 'Check: Which Key?', 'Choose one answer for each.', [
  { prompt: 'Ana sends Ben a message using asymmetric encryption. Which key does Ana use to encrypt it?',
    options: ["Ben's private key", "Ben's public key", "Ana's private key", 'A key that Ana and Ben share'], correct: 1,
    explain: "Ana encrypts with Ben's public key, so only Ben's private key can decrypt it." },
  { prompt: "Eve intercepts Ben's public key and the cipher text. Why can she not read the message?",
    options: ['The cipher text is too long', 'She does not know the algorithm', 'The public key cannot decrypt it', 'The public key was sent first'], correct: 2,
    explain: "The public key only encrypts. Decrypting needs Ben's private key, which was never sent." },
], ['Why does every person make their own two keys, rather than everyone sharing one private key?', 'If everyone had the same private key, anyone could decrypt anyone\'s messages. A private key is only safe if one person has it.']));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Which Key?', 'drill-y10-2-3-l2-keys', 'Activity 1: Which Key?',
  'Who encrypts, who decrypts, and with whose key? Then decide who can read each message. New names every time. Stuck? Switch on <strong>I need help</strong>.',
  ['Why do you always need to say WHOSE key, not just "the public key"?', 'Everyone has their own public key and private key. A key only works with its own partner key.']));

// ---------------------------------------------------------------- activity 2: class messages (ClassMessages app)
// Students send each other real messages as packets (James, 2026-10-21). Each browser makes its own two keys; only
// the public key is published, the private key never leaves the browser, and the packets carry only cipher text.
// The receiver puts the packets back in order by packet number (2.1), then decrypts with their private key.
// Messages.gs keeps a plain text safety copy for the teacher.
steps.push(embed('activity-send', 'Activity 2: Send a Secret Message', 'class-messages-asymmetric', 'Activity 2: Send a Secret Message',
  'Press Make my keys. Choose the person next to you, write a message, press Encrypt with their public key, then press Send.',
  ['Everyone can see your public key, even Eve. Why is that safe?', 'The public key only encrypts. Decrypting needs your private key, and that never leaves your computer.']));
steps[steps.length - 1].embedQuery = 'view=send';
steps.push(embed('activity-read', 'Activity 2: Read Your Messages', 'class-messages-asymmetric', 'Activity 2: Read Your Messages',
  'Tap the packets in order, packet 1 first, and press Check the order. Then press Decrypt with my private key.',
  ['Why must you read your messages on the computer where you made your keys?', 'Your private key is stored only on that computer. It is never sent, so no other computer has it.']));
steps[steps.length - 1].embedQuery = 'view=inbox';

// 0478/11 June 2025 Q6(a), last four gaps. Mark scheme: public/private; private/public (must be opposite of the first);
// public; private. Q6(b) is on the exam-similar slide.
const LIST_3 = ['algorithm', 'binary', 'cipher text', 'compression', 'error', 'hardware', 'hexadecimal', 'meaningless', 'plain text', 'private', 'public', 'readable', 'transmission', 'unreadable'];
steps.push(checkStep('exam-gaps-2', 'Exam Question: Asymmetric Encryption', 'Exam Question: Asymmetric Encryption',
  'Parts (a) to (c): last four gaps of ' + cite('0478/11, June 2025, Question 6(a)') + ' You may use a term more than once.', [
    { marks: 2, label: 'Gaps 1 and 2: type both words, in order.',
      answer: '^\\s*(a\\s+)?(public(\\s*-?\\s*key)?(\\s*(,|and|then|&|/|\\s)\\s*)(a\\s+)?private|private(\\s*-?\\s*key)?(\\s*(,|and|then|&|/|\\s)\\s*)(a\\s+)?public)(\\s*-?\\s*key)?\\s*\\.?\\s*$',
      feedback: 'Two different kinds of key. Which one encrypts, and which one decrypts?' },
    { label: 'Gap 3', answer: '^\\s*(the\\s+)?public(\\s*-?\\s*key)?\\s*\\.?\\s*$', feedback: 'Which key can any device ask for?' },
    { label: 'Gap 4', answer: '^\\s*(the\\s+)?private(\\s*-?\\s*key)?\\s*\\.?\\s*$', feedback: 'Which key does only your device know?' },
  ], ['Why check that a sentence still makes sense after each gap is filled?', 'A word can look right alone but give the sentence the wrong meaning.'],
  para(`A ${gap(1)} key is used to encrypt the data. This key cannot be used to decrypt the data. A ${gap(2)} key is used to decrypt the data. Any device is able to request the ${gap(3)} key, but only your device knows the ${gap(4)} key.`) + chips(LIST_3)));

// ---------------------------------------------------------------- compare: symmetric and asymmetric side by side
const row = (a, b, c) => `<tr><th style="padding:6px 10px;text-align:left;font-size:16px">${a}</th><td style="padding:6px 10px;font-size:16px">${b}</td><td style="padding:6px 10px;font-size:16px">${c}</td></tr>`;
steps.push({ id: 'compare-methods', label: 'Compare: Symmetric and Asymmetric',
  content: '<h2 class="lesson-h2">Compare: Symmetric and Asymmetric</h2>' +
    tps('Predict: Eve can intercept every message, including any key that is sent. Which method still keeps the data safe? Why?',
      '<p><strong>Asymmetric.</strong> The only key it sends is the public key, and that cannot decrypt.</p><p>Symmetric must send the key that decrypts, so Eve could get it.</p>') +
    '<table class="donow-table" style="margin:0 auto;width:100%"><tr><th></th><th style="padding:6px 10px;text-align:left">Symmetric</th><th style="padding:6px 10px;text-align:left">Asymmetric</th></tr>' +
    row('Keys', 'One shared key', 'Two keys: a public key and a private key') +
    row('Encrypt with', 'The shared key', "The receiver's public key") +
    row('Decrypt with', 'The same key', "The receiver's private key: a different key") +
    row('Is the key that decrypts sent?', 'Yes: it must reach the receiver', 'No: it is never sent') +
    '</table>' +
    facts(['<strong>The same in both:</strong> a key is used, plain text becomes cipher text, intercepted data is meaningless.', 'Asymmetric is <strong>more secure</strong>: the key that decrypts is never sent.']) });

// 0478/13 November 2024 Q2(g)(i), any one from: to keep it secure; the data is sensitive/confidential; to make it
// meaningless. Q2(g)(ii), any one from: they both use a key; they both scramble the data // both make the data
// meaningless; they both turn plain text into cypher text. Part (c): 0478/11 June 2025 Q6(b), any one from: the process
// is more secure; do not need to worry about key exchange.
steps.push(checkStep('exam-similar', 'Exam Question: The Same in Both', 'Exam Question: The Same in Both',
  'Parts (a) and (b): ' + cite('0478/13, November 2024, Question 2(g)(i) and (ii)') + ' An employee has a report that they need to email to their employer. The email data is encrypted using asymmetric encryption before it is sent. Part (c): ' + cite('0478/11, June 2025, Question 6(b)'), [
    { line: true, label: 'Give one reason why the email data is encrypted.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(secur\\w*|safe\\w*|sensitive|confidential|private|personal|secret|meaningless|unreadable|cannot\\s+be\\s+(read|understood)|can.?t\\s+be\\s+(read|understood)|protect\\w*)\\b).*$',
      feedback: 'What kind of data is a work report, and what does encryption do to it?' },
    { line: true, label: 'Give one similarity between symmetric encryption and asymmetric encryption.',
      answer: '^(?!.*\\b(same|one|single|shared|two|public|private)\\s+keys?\\b)(?!.*\\b(sen[dt]\\w*|shar\\w*)\\b)(?=.*\\b(both|each|they|all|same|similar\\w*|either)\\b|.*\\buses?\\b)(?=.*\\b(keys?|scrambl\\w*|meaningless|unreadable|plain\\s*text|ciph\\w*|cyph\\w*|encrypt\\w*\\s+the\\s+data)\\b).*$',
      feedback: 'What is true of BOTH methods? Look at the "same in both" line.' },
    { line: true, label: 'Give one reason why a person would use asymmetric encryption instead of symmetric encryption.',
      answer: '^(?!.*\\b(not|less)\\s+(more\\s+)?(secure|safe))(?:.*\\b(more|very|most|extra)\\s+(secure|safe)\\b|.*\\b(safer|securer)\\b|(?=.*\\bkeys?\\b)(?=.*\\b(no|not|dont|doesnt|cant|isnt|wont|didnt|\\w+n\\Wt|never|without)\\b)(?=.*\\b(exchang\\w*|shar\\w*|sen[dt]\\w*|swap\\w*|transmit\\w*|intercept\\w*|stolen|travel\\w*)\\b)).*$',
      feedback: 'Think about the weak point of symmetric encryption.' },
  ], ['Why must a similarity be true of BOTH methods, not just one?', 'A similarity is a fact that holds for each one. Test your idea against symmetric, then against asymmetric.']));

// 0478/13 November 2024 Q2(g)(iii). Mark scheme, any two from as below (the published scheme's "one/public key" for
// symmetric is written here as "one key").
steps.push(selfMarked('exam-differences', 'Exam Question: Two Differences', 'Exam Question: Two Differences',
  cite('0478/13, November 2024, Question 2(g)(iii)') + ' The email data is encrypted using asymmetric encryption before it is sent.', [
    { id: 'two-differences', prompt: '(iii) Give two differences between symmetric encryption and asymmetric encryption.', marks: 2,
      scheme: ['Symmetric uses one key, whereas asymmetric uses two keys (a public and a private key)',
        'Symmetric can send the key with the data, whereas asymmetric does not',
        'Symmetric decrypts the data using the same key, whereas asymmetric decrypts the data using a different key',
        'Symmetric is less secure than asymmetric (accept asymmetric is more secure than symmetric)'],
      guidance: 'Any two from the points.',
      modelAnswer: 'Any two from: symmetric uses one key, whereas asymmetric uses two keys (public and private); symmetric can send the key with the data, whereas asymmetric does not; symmetric decrypts with the same key, whereas asymmetric decrypts with a different key; symmetric is less secure than asymmetric.' },
  ], ['Why does a good difference name both methods in one sentence?', 'The mark is for the contrast. Say what one method does, then "whereas", then what the other does instead.']));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 3: Symmetric or Asymmetric?', 'drill-y10-2-3-l2-compare', 'Activity 3: Symmetric or Asymmetric?',
  'Decide which method each statement is about. Then decide who can read each message, and explain why. Stuck? Switch on <strong>I need help</strong>.',
  ['Why is it useful to test a statement against both methods?', 'Some statements are true for one method only. Others are true for both. Testing each one shows which.']));

// 0478/12 March 2024 Q7(a)(ii). Mark scheme, four from as below.
steps.push(selfMarked('exam-describe', 'Exam Question: Describe the Differences', 'Exam Question: Describe the Differences',
  cite('0478/12, March 2024, Question 7(a)(ii)') + ' Data is transmitted using the internet. The data is encrypted before transmission.', [
    { id: 'describe-differences', prompt: '(ii) Describe the differences between symmetric and asymmetric encryption.', marks: 4,
      scheme: ['Symmetric has a shared key',
        'The symmetric key is used to encrypt and decrypt',
        'In symmetric, both the sender and receiver know the key',
        'Asymmetric has different keys (accept a public key and a private key)',
        'In asymmetric, the public key encrypts the data and the private key decrypts it',
        'Anyone can know the public key, but only those intended know the private key'],
      // The published MS: "Four from:", with "Symmetric has a shared key... / ... to encrypt and decrypt" and
      // "Asymmetric has different keys ... / ...public to encrypt ... / ...anyone can know the public key ...".
      guidance: 'Four from the points. Point 2 follows on from point 1, and points 5 and 6 follow on from point 4: the mark scheme writes them with ...',
      modelAnswer: 'Four from: symmetric has a shared key ... to encrypt and decrypt; both the sender and receiver know the key; asymmetric has different keys, a public key and a private key; ... the public key encrypts the data and the private key decrypts it; anyone can know the public key, but only those intended know the private key.' },
  ], ['Why plan two facts about each method before you write?', 'Each mark is one fact, so two facts about each method cover four marks.']));

// ---------------------------------------------------------------- checked practice
// 0478/11 November 2025 Q2(e)(ii). Mark scheme: asymmetric. Parts (b) to (d) are not from the paper.
steps.push(checkStep('practice', 'Practice: Asymmetric Encryption', 'Practice: Asymmetric Encryption',
  'Part (a): ' + cite('0478/11, November 2025, Question 2(e)(ii)') + ' The image data is encrypted using symmetric encryption.', [
    { label: 'Give one other type of encryption that could be used.', answer: '^\\s*(an?\\s+)?(asymmetric|asynchronous)(\\s+(key\\s+)?encryption)?\\s*\\.?\\s*$|^\\s*public\\s*(key\\s*)?(and|&|\\/)\\s*private\\s*key(\\s+encryption)?\\s*\\.?\\s*$',
      feedback: 'Which method uses two different keys?' },
    { label: 'Dara wants anyone to be able to send her secret messages. Which of her two keys does she give out?',
      answer: '^\\s*(the\\s+|her\\s+|dara\\W?s\\s+)?public(\\s*-?\\s*key)?\\s*\\.?\\s*$', feedback: 'Which key only encrypts?' },
    { line: true, label: 'Why is it safe for Dara to give that key to anyone, even Eve?',
      answer: '^(?=.*\\b(cannot|can.?t|unable|not|never|only)\\b)(?=.*\\b(decrypt\\w*|unlock\\w*|read\\w*|undo\\w*|encrypt\\w*)\\b).*$',
      feedback: 'What can that key do, and what can it not do?' },
    { line: true, label: "Ana encrypts a message to Ben, but uses Chen's public key by mistake. Why can Ben not read it?",
      answer: '^(?=.*\\b(chen\\W?s?|only|wrong|different|match\\w*|other|another|not\\s+his|isn.?t\\s+his)\\b)(?=.*\\b(private|decrypt\\w*|keys?)\\b)(?!.*\\bben\\W?s\\s+public\\b).*$',
      feedback: 'Which private key matches the public key Ana used, and who has it?' },
  ], ['Why do exam answers about keys say whose key it is?', 'Each person has their own two keys. Naming the owner shows exactly which key you mean.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Asymmetric Encryption Drill', 'drill-y10-2-3-l2', 'Plenary: Asymmetric Encryption Drill',
  'Why two keys, which key does what, who can read it, and how symmetric and asymmetric compare. Your progress is saved.',
  ['Why practise with new names and new cases every time?', 'If you can choose the right key for anyone, you really understand how the two keys work.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now', 0, ['algorithm', 'an algorithm', 'Algorithm.'], ['binary', 'key', 'hardware']);
ok('do-now', 1, ['plain text', 'plaintext', 'the plain text'], ['cipher text', 'readable', 'binary']);
ok('do-now', 2, ['cipher text', 'Cypher text', 'ciphertext'], ['plain text', 'unreadable', 'cipher']);
ok('do-now', 3, ['meaningless', 'Meaningless.'], ['unreadable', 'readable', 'encrypted']);
ok('do-now-2', 0, ['destination address, packet number', 'destination IP and sender IP', "the receiver's IP address and the sender's IP address", 'source address, sequence number', 'packet number and destination address', 'the number of the packet and the IP address of the receiver'],
  ['IP address, packet number', 'destination address', 'packet number', 'payload and destination address', 'destination, sender', 'the data and the packet']);
ok('do-now-2', 1, ['to send each packet towards its destination', 'it controls the route the packet takes', 'chooses the most efficient route', 'forwards packets to the next router', 'it routes the packets'],
  ['it connects devices', 'a router is a device', 'it sends data', 'it stores packets', 'not sure']);
ok('do-now-2', 2, ['they take different routes', 'each packet takes its own path', 'some routes are slower than others', 'they travel separately on different paths'],
  ['they are sent at different times', 'the router is slow', 'they get lost', 'because of errors']);
ok('exam-gaps', 0, ['plain text', 'Plaintext'], ['cipher text', 'encrypted']);
ok('exam-gaps', 1, ['cipher text', 'cypher text'], ['plain text', 'protected']);
ok('exam-gaps', 2, ['public key', 'a public key', 'public'], ['private key', 'serial key', 'symmetric']);
ok('exam-gaps', 3, ['private key', 'a private key', 'private'], ['public key', 'parallel key', 'decrypted']);
ok('exam-gaps-2', 0, ['public, private', 'public private', 'public and private', 'private, public', 'public key, private key', 'Public / private'], ['public, public', 'private, private', 'public', 'plain text, cipher text', 'private']);
ok('exam-gaps-2', 1, ['public', 'public key'], ['private', 'algorithm']);
ok('exam-gaps-2', 2, ['private', 'private key'], ['public', 'meaningless']);
ok('exam-similar', 2, ['it is more secure', 'safer', 'you do not need to send the key', 'no key exchange is needed', 'the private key is never sent'], ['it is faster', 'it uses a key', 'more keys', 'not secure', 'it is encrypted']);
ok('exam-similar', 0, ['to keep it secure', 'the report is confidential', 'to make it meaningless if it is intercepted', 'so it cannot be read by others'], ['to send it', 'to make it smaller', 'to check for errors']);
ok('exam-similar', 1, ['they both use a key', 'both make the data meaningless', 'both turn plain text into cipher text', 'they both scramble the data', 'both use keys'],
  ['they both use the same key', 'both use a public key', 'they both send the key', 'they both use one key', 'they are fast', 'both use two keys']);
ok('practice', 0, ['asymmetric', 'Asymmetric encryption', 'asynchronous', 'public and private key'], ['symmetric', 'SSL', 'encryption', 'public key']);
ok('practice', 1, ['public', 'her public key', 'the public key', "Dara's public key"], ['private', 'her private key', 'both']);
ok('practice', 2, ['it can only encrypt, it cannot decrypt', 'it cannot be used to decrypt messages', 'the public key cannot read the messages'], ['it is public', 'Eve is nice', 'it is long', 'it encrypts']);
ok('practice', 3, ["only Chen's private key can decrypt it", "Ben's private key does not match Chen's public key", 'he has the wrong private key', 'it needs a different private key to decrypt'],
  ['it is encrypted', 'Ben is not there', 'Chen sent it', "Ben's public key"]);
// The Do Now walkthroughs: every step, as plain text (alone and with its picture), must fail every part on its slide.
{
  const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
    assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
    V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
      [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abcde'[i]}: ${plain(part)}`));
    }));
  });
  assert(!/algorithm|plain\s*text|ciph|cyph|meaningless|\bkeys?\b/i.test(plain(JSON.stringify(WT_GAPS))), 'gaps walkthrough names a Do Now answer');
  assert(!/destination|address|\bip\b|sender|source|packet number|sequence|\broute(s|d)?\b|routing|\bpath|forward|towards|different way/i.test(plain(JSON.stringify(WT_HEADER))), 'header walkthrough gives a Do Now answer');
}
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/asymmetric|public key|private key|\bpublic\b|\bprivate\b|two (different )?keys/i, 'concept-asymmetric'], [/padlock/i, 'concept-padlock'], [/digital certificate|\bSSL\b|\bTLS\b|key pair/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}

// ---------------------------------------------------------------- drills
const drillHead = (id, about) => `// Year 10, 2.3 L2: Asymmetric Encryption. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y10_2_3_l2.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()})()\n});\n`;

// ---- Do Now Extension: Topic 2 so far (2.1, 2.2, 2.3 L1). Every card has an example on different details and two nudges.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+|an\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
  function sh(w, k) { return w.replace(/[A-Z]/g, function (c) { return String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26 + 26) % 26 + 65); }); }
  function exact(s) { return new RegExp("^\\s*" + s + "\\s*\\.?\\s*$", "i"); }
  function uniq(ans, list) { var out = []; list.forEach(function (x) { if (x !== ans && out.indexOf(x) < 0) out.push(x); }); return out.slice(0, 3); }
  function pairs(w, k) { return w.split("").map(function (c) { return c + " to " + sh(c, k); }).join(", "); }
  function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
  var ABC = "Alphabet: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
  var WORDS = ["HAT", "PEN", "CUP", "RUN", "TOP", "LAMP", "DESK", "FROG","BOAT", "CAKE", "HILL", "KITE", "MOON", "ROAD", "SALT"];
  return [
    // ------------------------------------------------ Data Transmission (2.1)
    { id: "ex-01", category: "ex-trans", prompt: "A file is sent as many small packets. One packet is lost on the way. Why is that better than sending the file as one big block?", answers: ["Only the lost packet has to be sent again"],
      keywords: [/^(?=.*\b(only|just|that\s+one|single|one\s+packet|not\s+the\s+whole|not\s+all|not\s+everything|rest)\b)(?=.*\b(resen\w*|sent\s+again|send\s+again|again|repeat\w*|retransmit\w*|re-?sent)\b).*$/i],
      distractors: ["The packets are encrypted", "The file arrives in order", "No errors can happen"],
      example: "Example question: why does a removal company use many small boxes, not one huge crate?\nStep 1: think about what goes wrong: one box gets damaged on the way.\nStep 2: with small boxes, the company replaces that one box. Everything else arrived safely.\nStep 3: with one huge crate, a problem means starting again with everything.\nNow your question: one packet is lost. What has to happen next, and to how much of the file?",
      working: ["Think about what the receiver is still missing.", "With one big block, what would have to be sent again? With packets?"],
      note: "Only the lost packet is sent again, not the whole file. That saves time on the network." },
    { id: "ex-02", category: "ex-trans", randomize: function () {
        var s = drillPick([["Data is sent between two buildings, 1 km apart.", "Serial"], ["Data moves inside a computer chip, millimetres apart, as fast as possible.", "Parallel"], ["A computer sends data to a printer in another room, 30 metres away.", "Serial"]]);
        return { prompt: s[0] + " Should it use serial or parallel transmission?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
          distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
          example: "Example: data is sent down a cable 500 metres long.\nStep 1: one method sends several bits at once, down several wires.\nStep 2: over a long cable, bits on different wires arrive at slightly different times (skew), so the data can be wrong.\nStep 3: the other method sends one bit at a time down one wire, so the bits stay in order.\nRule: long distance = one bit at a time. Very short distance and very fast = several bits at once.",
          working: ["Is the distance long or very short?", "Over a long cable, bits sent side by side can arrive at different times."],
          note: s[1] + ". " + (s[1] === "Serial" ? "Over a long distance, one bit at a time keeps the bits in order: no skew." : "Over a very short distance, several bits at once is fastest.") };
      } },
    { id: "ex-03", category: "ex-trans", prompt: "A webcam only ever sends video to the computer. The computer never sends data back. Why is simplex transmission enough?", answers: ["Data only needs to travel one way"],
      keywords: [/^(?=.*\b(one|single|1)\s+(way|direction)\b|.*\bnever\s+(sends?|goes|travels?|comes?)\s+back\b|.*\b(only|just)\b.*\b(to\s+the\s+computer|from\s+the\s+webcam)\b).*$/i],
      distractors: ["Data needs to travel both ways", "Video is sent in parallel", "Simplex is the fastest method"],
      example: "Example question: why can a doorbell button use simplex?\nStep 1: ask: which way does data travel? From the button to the bell.\nStep 2: ask: does the bell ever send anything back to the button? No.\nStep 3: simplex sends data in one direction only, and that is all the doorbell needs.\nNow your question: which way does the webcam's data travel, and does any come back?",
      working: ["Which way does the video travel?", "Does anything ever travel back to the webcam?"],
      note: "Simplex sends data in one direction only. The webcam's data only goes to the computer, so that is enough." },
    // ------------------------------------------------ Methods of Error Detection (2.2)
    { id: "ex-04", category: "ex-errors", randomize: function () {
        var mode = drillPick(["even", "odd"]), b = [];
        for (var i = 0; i < 7; i++) b.push(Math.random() < 0.5 ? "1" : "0");
        var d = b.join(""), p = (ones(d) % 2 === 0) === (mode === "even") ? "0" : "1", byte = p + d, err = Math.random() < 0.5;
        if (err) { var k = rnd(0, 7); byte = byte.slice(0, k) + (byte[k] === "1" ? "0" : "1") + byte.slice(k + 1); }
        var n = ones(byte), found = (n % 2 === 0) !== (mode === "even");
        return { prompt: (mode === "even" ? "Even" : "Odd") + " parity is used. This byte arrives: " + byte + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
          keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
          example: "Example: odd parity is used. The byte 11010000 arrives.\nStep 1: count the 1s in the whole byte: 1, 1, 1. That is 3.\nStep 2: odd parity means the count of 1s must be odd.\nStep 3: 3 is odd, so the count fits.\nRule: count fits the parity = no error detected. Count does not fit = error detected.",
          working: ["Count the 1s in the whole byte, parity bit included.", "Should that count be even or odd? Does it fit?"],
          note: byte + " has " + n + " ones. With " + mode + " parity that " + (found ? "does not fit: an error is detected." : "fits: no error is detected.") };
      } },
    { id: "ex-05", category: "ex-errors", prompt: "Why does an echo check send a copy of the data back to the sender?", answers: ["So the sender can compare it with the original"],
      keywords: [/^(?=.*\b(compar\w*|match\w*|same|differ\w*|check\w*\s+(it\s+)?against)\b)(?=.*\b(original|it\s+sent|was\s+sent|first|own|kept|before|started)\b).*$/i],
      distractors: ["So the receiver gets two copies", "To make the data travel faster", "To add a parity bit"],
      example: "Example question: you dictate a phone number to a friend. Why do you ask them to read it back to you?\nStep 1: you still know the number you said.\nStep 2: when they read it back, you hold both: what you said and what they heard.\nStep 3: if the two are not the same, something went wrong on the way.\nNow your question: who still has the data as it was before sending, and what can they do with the copy?",
      working: ["The sender still has the data it sent.", "What can the sender do with the copy and the data it kept?"],
      note: "The sender compares the copy with the original data it kept. If they do not match, an error happened." },
    { id: "ex-06", category: "ex-errors", prompt: "In automatic repeat query (ARQ), why does the receiver send a positive acknowledgement?", answers: ["So the sender knows the data arrived without errors"],
      keywords: [/^(?=.*\b(know\w*|tell\w*|told|confirm\w*|let\w*|shows?|inform\w*)\b)(?=.*\b(arriv\w*|receiv\w*|got|ok|okay|correct\w*|no\s+errors?|without\s+errors?|safe\w*|fine)\b).*$/i],
      distractors: ["To add a check digit", "To make the data smaller", "To encrypt the data"],
      example: "Example question: why does a delivery driver ask you to sign for a parcel?\nStep 1: the shop needs proof that the parcel reached you.\nStep 2: your signature is a message back: it got here, and it is fine.\nStep 3: with that message, the shop does not send the parcel again.\nNow your question: what does a positive acknowledgement tell the sender?",
      working: ["The acknowledgement is a message from the receiver back to the sender.", "What does the sender learn from it about the data?"],
      note: "A positive acknowledgement tells the sender the data arrived without errors, so it does not need to be sent again." },
    { id: "ex-07", category: "ex-errors", prompt: "When a number with a check digit is typed in, the check digit is calculated again. Why?", answers: ["To compare it with the check digit typed in, to find a typing error"],
      keywords: [/^(?=.*\b(compar\w*|match\w*|same|differ\w*)\b)(?=.*\b(errors?|mistakes?|wrong|typos?|typed|correct\w*|incorrect\w*|entered)\b).*$/i],
      distractors: ["To make the number longer", "To encrypt the number", "To send the number twice"],
      example: "Example question: a shop adds up a bill, and you add it up again yourself. Why?\nStep 1: you work out the total in the same way the shop did.\nStep 2: you put your total next to the total on the bill.\nStep 3: if the totals do not match, someone made a mistake.\nNow your question: the computer works out the check digit again. What does it do with it, and what does that find?",
      working: ["The computer works out the check digit again, from the other digits.", "What does it do with its result and the check digit that was typed?"],
      note: "The calculated check digit is compared with the one typed in. If they are different, there is a typing error." },
    // ------------------------------------------------ Symmetric Encryption (2.3 L1)
    { id: "ex-08", category: "ex-enc", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), a = sh(w, k), e = drillPick(WORDS.filter(function (x) { return x !== w; })), ek = k === 9 ? 2 : k + 1;
        return { prompt: "Algorithm: move each letter forward along the alphabet by the key. After Z, carry on from A.\n" + ABC + "\nPlain text: " + w + "\nKey: " + k + "\nWhat is the cipher text?", answers: [a], keywords: [exact(a)],
          distractors: uniq(a, [sh(w, -k), sh(w, k + 1), sh(w, k - 1)]),
          example: "Example: encrypt " + e + " with the key " + ek + ".\nStep 1: take the first letter, " + e[0] + ". Move forward " + ek + " places: " + e[0] + " becomes " + sh(e[0], ek) + ".\nStep 2: do the same for every letter: " + pairs(e, ek) + ".\nStep 3: the cipher text is " + sh(e, ek) + ".",
          working: ["Start with " + w[0] + ". Count " + k + " letters forward along the alphabet.", "Do the same for every letter of " + w + "."],
          note: "Each letter moves forward " + k + ": " + pairs(w, k) + "." };
      } },
    { id: "ex-09", category: "ex-enc", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), c = sh(w, k), e = drillPick(WORDS.filter(function (x) { return x !== w; })), ek = k === 9 ? 2 : k + 1, ec = sh(e, ek);
        return { prompt: "Symmetric encryption: the same key decrypts. Move each letter BACK by the key. Before A, carry on from Z.\n" + ABC + "\nCipher text: " + c + "\nKey: " + k + "\nWhat is the plain text?", answers: [w], keywords: [exact(w)],
          distractors: uniq(w, [sh(c, k), sh(w, 1), sh(w, -1)]),
          example: "Example: decrypt " + ec + " with the key " + ek + ".\nStep 1: take the first letter, " + ec[0] + ". Move back " + ek + " places: " + ec[0] + " becomes " + e[0] + ".\nStep 2: do the same for every letter: " + pairs(ec, -ek) + ".\nStep 3: the plain text is a real word.",
          working: ["Start with " + c[0] + ". Count " + k + " letters back along the alphabet.", "Do the same for every letter. The answer is a real word."],
          note: "Each letter moves back " + k + ": " + pairs(c, -k) + "." };
      } },
    { id: "ex-10", category: "ex-enc", prompt: "Why is a 128-bit key much harder to crack than the letter shift?", answers: ["It has far more possible keys, so trying them all takes too long"],
      keywords: [/^(?=.*\b(more|many|lots|huge|billions?|combinations?|possib\w*|options?|doubl\w*)\b)(?=.*\b(try|trying|tried|tries|guess\w*|check\w*|test\w*|long|longer|time|years|forever|ages)\b).*$/i],
      distractors: ["128-bit keys are kept secret", "Its letters are in a different order", "It is sent in packets"],
      example: "Example question: why is a 6-digit door code harder to guess than a 2-digit code?\nStep 1: a 2-digit code has 100 possible codes: 00 to 99.\nStep 2: a 6-digit code has 1 000 000 possible codes.\nStep 3: a thief must try codes one by one, so 1 000 000 tries take far longer than 100.\nNow your question: the letter shift has 25 keys. A 128-bit key has 2 to the power 128. What does that mean for someone trying every key?",
      working: ["Compare how many keys each one has.", "Someone without the key must try keys one by one. How long would that take?"],
      note: "2 to the power 128 possible keys: trying them all would take far longer than anyone could wait." }
  ];
}

// ---- Activity 1: which key encrypts, which decrypts, and who can read it. Random names every draw.
function keysCards() {
  var NAMES = ["Ana", "Ben", "Chen", "Dara", "Femi", "Hana", "Ivan", "Lina", "Omar", "Rosa"];
  function two(not) {
    var pool = NAMES.filter(function (n) { return (not || []).indexOf(n) < 0; });
    var a = drillPick(pool), b = drillPick(pool.filter(function (n) { return n !== a; }));
    return [a, b];
  }
  function own(name, kind) { return new RegExp("^\\s*(the\\s+)?(" + name + "\\W?s?\\s+" + kind + "(\\s*-?\\s*key)?|" + kind + "\\s+key\\s+(of|from|belonging\\s+to)\\s+" + name + ")\\s*\\.?\\s*$", "i"); }
  function yesNo(a) { return a === "Yes" ? /^\s*yes\b/i : /^\s*no\b/i; }
  var SCEN = [
    ["Ben sends his public key to Ana. Eve intercepts it. Ana encrypts her message with Ben's public key. Eve intercepts the cipher text.", "Eve", "No", "Eve has only Ben's public key. Only Ben's private key decrypts."],
    ["Ana encrypts her message with Ben's public key. Eve copies Ben's private key from his laptop. Then she intercepts the cipher text.", "Eve", "Yes", "Eve has Ben's private key, and that decrypts the message."],
    ["Eve sends Ana her own public key and says it is Ben's. Ana encrypts her message with it. Eve intercepts the cipher text.", "Eve", "Yes", "The message was encrypted with Eve's public key, so Eve's private key decrypts it."],
    ["Ana encrypts her message with Chen's public key by mistake and sends it to Ben.", "Ben", "No", "Only Chen's private key decrypts it. Ben's private key does not match."],
    ["Ana encrypts her message with Ben's public key and sends it to Ben.", "Ben", "Yes", "Ben's private key matches Ben's public key."],
    ["Ana sends her message to Ben as plain text, without encrypting it. Eve intercepts it.", "Eve", "Yes", "It was never encrypted, so there is nothing to decrypt."],
    ["Ana encrypts her message with Ben's public key. Chen intercepts the cipher text. Chen has his own private key.", "Chen", "No", "Chen's private key does not match Ben's public key."]
  ];
  var EX_READ = "Example: Lina encrypts a message with Omar's public key. Rosa intercepts the cipher text, and she also has Omar's public key.\nStep 1: which public key was used? Omar's. So which private key decrypts? Only Omar's.\nStep 2: does Rosa have Omar's private key? No: she has only his public key.\nStep 3: so Rosa cannot read it.\nRule: you can read it only with the private key that matches the public key used, or if it was never encrypted.";
  return [
    { id: "k-01", category: "k-which", format: "Type whose key and which key, for example: Rosa's public key", randomize: function () {
        var p = two(), s = p[0], r = p[1], e = two([s, r]);
        return { prompt: s + " wants to send a secret message to " + r + " using asymmetric encryption. Which key does " + s + " use to encrypt it?", answers: [r + "'s public key"], keywords: [own(r, "public")],
          distractors: [r + "'s private key", s + "'s public key", s + "'s private key"],
          example: "Example: " + e[0] + " sends a message to " + e[1] + ".\nStep 1: who will read it? " + e[1] + ".\nStep 2: only the reader's private key should be able to decrypt it.\nStep 3: so " + e[0] + " encrypts with the key that matches it: " + e[1] + "'s public key.",
          working: ["Who will read the message?", "Which of that person's keys does anyone have, and can use to encrypt?"],
          note: s + " uses " + r + "'s public key. Then only " + r + "'s private key can decrypt it." };
      } },
    { id: "k-02", category: "k-which", format: "Type whose key and which key, for example: Rosa's private key", randomize: function () {
        var p = two(), s = p[0], r = p[1], e = two([s, r]);
        return { prompt: s + " encrypts a message with " + r + "'s public key and sends it. Which key decrypts it?", answers: [r + "'s private key"], keywords: [own(r, "private")],
          distractors: [r + "'s public key", s + "'s private key", s + "'s public key"],
          example: "Example: a message is encrypted with " + e[1] + "'s public key.\nStep 1: a public key cannot decrypt, not even the one that encrypted it.\nStep 2: the only key that decrypts it is the private key that matches that public key.\nStep 3: so it is " + e[1] + "'s private key.",
          working: ["Whose public key was used?", "A public key cannot decrypt. Which key matches it?"],
          note: r + "'s private key is the only key that decrypts it." };
      } },
    { id: "k-03", category: "k-which", prompt: "Hana wants anyone in the world to be able to send her secret messages. Which of her two keys does she give out?", answers: ["Her public key"],
      keywords: [/^\s*(the\s+|her\s+|hana\W?s\s+)?public(\s*-?\s*key)?\s*\.?\s*$/i], distractors: ["Her private key", "Both keys", "Neither key"],
      example: "Example: Ben posts open padlocks to anyone who asks, and keeps the only key.\nStep 1: a padlock lets people lock a box for Ben. It cannot open one.\nStep 2: the key opens boxes, so it stays with Ben.\nStep 3: Ben gives out the thing that only locks.\nNow your question: which of Hana's keys only encrypts?",
      working: ["Which key only encrypts and cannot decrypt?", "That key is safe for anyone to have."],
      note: "She gives out her public key. Anyone can encrypt with it, but only her private key decrypts." },
    { id: "k-04", category: "k-which", prompt: "In asymmetric encryption, which key must never be sent across the network?", answers: ["Private key"],
      keywords: [/^\s*(the\s+|a\s+|your\s+)?private(\s*-?\s*key)?\s*\.?\s*$/i], distractors: ["The public key", "Both keys", "The cipher text"],
      example: "Example: a shop has a till and a safe. The till is open to all staff. The safe is not.\nStep 1: ask which one protects the money that matters most.\nStep 2: the safe. Its code is told to nobody.\nNow your question: which key decrypts messages? That is the one to keep to yourself.",
      working: ["Which key decrypts the messages?", "If that key were intercepted, what could Eve do?"],
      note: "The private key decrypts, so it never leaves its owner. Only the public key is sent." },
    { id: "k-05", category: "k-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan " + s[1] + " read the message? Yes or No?", answers: [s[2]], keywords: [yesNo(s[2])], distractors: [s[2] === "Yes" ? "No" : "Yes"], example: EX_READ,
          working: ["Which public key was used? So which private key decrypts?", "Does " + s[1] + " have that private key?"], note: s[2] + ". " + s[3] };
      } },
    { id: "k-06", category: "k-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan " + s[1] + " read the message? Yes or No?", answers: [s[2]], keywords: [yesNo(s[2])], distractors: [s[2] === "Yes" ? "No" : "Yes"], example: EX_READ,
          working: ["List what " + s[1] + " has: which keys, and the cipher text?", "Only the private key that matches the public key used can decrypt it."], note: s[2] + ". " + s[3] };
      } },
    { id: "k-07", category: "k-why", prompt: "Eve has Ben's public key and the cipher text. Why can she not read the message?", answers: ["The public key cannot decrypt; only Ben's private key can"],
      keywords: [/^(?=.*\b(cannot|can.?t|unable|not|never|only|no|does\s*n.?t|doesnt|needs?|requires?)\b)(?=.*\b(decrypt\w*|unlock\w*|read\w*|undo\w*|private)\b)(?=.*\b(public|private)\b)(?!.*\bpublic\s+key\s+(decrypts|can\s+decrypt)).*$/i],
      distractors: ["The cipher text is too long", "Eve does not know the algorithm", "The public key was sent first"],
      example: "Example: Rosa has one of Omar's open padlocks and a box Omar's friend locked with another one.\nStep 1: a padlock locks boxes. It cannot open them.\nStep 2: only Omar's key opens it, and Omar never sent that.\nStep 3: so Rosa cannot open the box.\nNow your question: what can Ben's public key do, and what can it not do?",
      working: ["What is a public key used for: encrypting or decrypting?", "Which key would Eve need, and who has it?"],
      note: "A public key only encrypts. Decrypting needs Ben's private key, and only Ben has it." },
    { id: "k-08", category: "k-why", prompt: "Why is it safe for Ben to give his public key to anyone, even Eve?", answers: ["It can only encrypt; it cannot decrypt messages"],
      keywords: [/^(?=.*\b(cannot|can.?t|unable|not|never|only|does\s*n.?t|doesnt)\b)(?=.*\b(decrypt\w*|unlock\w*|read\w*|undo\w*|encrypt\w*)\b).*$/i],
      distractors: ["Eve will not use it", "It is too long to copy", "It changes every day"],
      example: "Example: why can a shop give its postbox address to anyone?\nStep 1: knowing the address lets you post letters in.\nStep 2: it does not let you take letters out. That needs the shop's key.\nStep 3: so sharing the address puts nothing at risk.\nNow your question: what does Ben's public key let Eve do, and what does it not let her do?",
      working: ["What can someone do with Ben's public key?", "Can it turn cipher text back into plain text?"],
      note: "The public key can only encrypt. It cannot decrypt, so Eve gains nothing from it." },
    { id: "k-09", category: "k-why", prompt: "Ana sends a message to Ben. Why does she encrypt it with Ben's public key, not her own?", answers: ["So only Ben's private key can decrypt it, and only Ben has that"],
      keywords: [/^(?=.*\b(ben\W?s?|receiver\W?s?|his|he|him)\b)(?=.*\b(private|decrypt\w*|read\w*)\b)(?=.*\b(only|match\w*|has|have|own|nobody|no\s+one|just)\b).*$/i],
      distractors: ["Her own key is too short", "Ben's key is faster", "Ana has no public key"],
      example: "Example: you want to send a locked box to Femi. You have your own padlock and one of Femi's padlocks.\nStep 1: if you use your own padlock, only your key opens it. Femi cannot open it.\nStep 2: if you use Femi's padlock, only Femi's key opens it.\nStep 3: so you lock it with the padlock of the person who must open it.\nNow your question: whose private key will decrypt the message, and who should that be?",
      working: ["Which key will decrypt the message, if Ana uses Ben's public key?", "Who has that key?"],
      note: "Encrypting with Ben's public key means only Ben's private key decrypts it, and only Ben has that." },
    { id: "k-10", category: "k-why", prompt: "Why does the private key never have to be sent to anyone?", answers: ["Only the receiver decrypts, and the receiver made it and already has it"],
      keywords: [/^(?=.*\b(already|keeps?|kept|own|owner|made|makes|created|creates|stays?|holds?)\b)(?=.*\b(receiver|owner|reader|person|they|he|she|ben|only|their|his|her)\b)(?=.*\b(decrypt\w*|read\w*|has|have|needs?|uses?|made|makes|created|own)\b).*$/i],
      distractors: ["It is sent inside the cipher text", "It is the same as the public key", "Nobody ever uses it"],
      example: "Example: why does a house owner never need to post their front door key to anyone?\nStep 1: who opens the front door? The owner.\nStep 2: where is the key? The owner already has it.\nStep 3: nobody else needs to open the door, so the key never travels.\nNow your question: who decrypts the messages, and where is the private key already?",
      working: ["Who is the only person who needs to decrypt the message?", "Where is the private key already?"],
      note: "The receiver made both keys and keeps the private key. Only the receiver decrypts, so it never travels." }
  ];
}

// ---- Activity 2: symmetric or asymmetric, who can read it, and why.
function compareCards() {
  function yesNo(a) { return a === "Yes" ? /^\s*yes\b/i : /^\s*no\b/i; }
  var SYM = /^\s*(the\s+)?symmetric(\s+(key\s+)?encryption)?\s*\.?\s*$/i, ASYM = /^\s*(the\s+)?asymmetric(\s+(key\s+)?encryption)?\s*\.?\s*$/i;
  var STATE = [
    ["One key encrypts and decrypts.", "Symmetric", "One key for both jobs: symmetric."],
    ["The key that decrypts is never sent.", "Asymmetric", "The private key stays with its owner: asymmetric."],
    ["A public key and a private key are used.", "Asymmetric", "Two different keys: asymmetric."],
    ["Both people must have the same key before the message is sent.", "Symmetric", "A shared key: symmetric."],
    ["Anyone can know the key that encrypts.", "Asymmetric", "The public key can be given to anyone: asymmetric."],
    ["If the key that is sent is intercepted, the message can be read.", "Symmetric", "The sent key also decrypts: symmetric."],
    ["The receiver decrypts with a different key from the one used to encrypt.", "Asymmetric", "Encrypt with the public key, decrypt with the private key: asymmetric."],
    ["The key must be sent to the receiver so they can decrypt.", "Symmetric", "The same key must reach the receiver: symmetric."]
  ];
  var EX_STATE = "Example statement: \"The receiver's public key is used to encrypt.\"\nStep 1: does it talk about one shared key, or two different keys? A public key means two different keys.\nStep 2: one shared key = symmetric. A public key and a private key = asymmetric.\nRule: ask how many keys, and whether the key that decrypts is ever sent.";
  var READ = [
    ["Symmetric encryption. Ana emails the key to Ben, then emails the cipher text. Eve intercepts both.", "Yes", "The key that was sent also decrypts."],
    ["Asymmetric encryption. Ben emails his public key to Ana, then Ana sends the cipher text. Eve intercepts both.", "No", "The public key cannot decrypt. Ben's private key was never sent."],
    ["Symmetric encryption. Ana and Ben agreed the key in person. Eve intercepts the cipher text.", "No", "Eve has no key, so the cipher text is meaningless."],
    ["Asymmetric encryption. Eve copies Ben's private key from his laptop, then intercepts the cipher text.", "Yes", "Eve has the private key that decrypts it."],
    ["Symmetric encryption. Ana sends the cipher text and the key in one email. Eve intercepts it.", "Yes", "Eve has the cipher text and the key that decrypts it."],
    ["Asymmetric encryption. Ana uses Ben's public key. Eve intercepts the cipher text and tries Ben's public key on it.", "No", "A public key cannot decrypt."]
  ];
  var EX_READ = "Example: symmetric encryption. Lina posts the key to Omar on a memory stick. Rosa steals the memory stick, then intercepts the cipher text.\nStep 1: in symmetric encryption, the key that was sent also decrypts.\nStep 2: Rosa has that key and the cipher text.\nStep 3: so Rosa can read it.\nRule: Eve can read it only if she has the key that DECRYPTS. Symmetric: the shared key. Asymmetric: the private key.";
  function stateCard(id) {
    return { id: id, category: "cm-which", randomize: function () {
        var s = drillPick(STATE);
        return { prompt: "\"" + s[0] + "\"\nIs this statement about symmetric or asymmetric encryption?", answers: [s[1]], keywords: [s[1] === "Symmetric" ? SYM : ASYM],
          distractors: [s[1] === "Symmetric" ? "Asymmetric" : "Symmetric"], example: EX_STATE,
          working: ["How many keys does the statement talk about: one shared key, or two different keys?", "Is the key that decrypts ever sent?"], note: s[2] };
      } };
  }
  function readCard(id) {
    return { id: id, category: "cm-read", randomize: function () {
        var s = drillPick(READ);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"], example: EX_READ,
          working: ["Which key decrypts in this method?", "Does Eve have that key, and the cipher text?"], note: s[1] + ". " + s[2] };
      } };
  }
  return [
    stateCard("c-01"), stateCard("c-02"), stateCard("c-03"),
    readCard("c-04"), readCard("c-05"),
    { id: "c-06", category: "cm-why", prompt: "Give one similarity between symmetric encryption and asymmetric encryption.", answers: ["They both use a key"],
      keywords: [/^(?!.*\b(same|one|single|shared|two|public|private)\s+keys?\b)(?!.*\b(sen[dt]\w*|shar\w*)\b)(?=.*\b(both|each|they|all|same|similar\w*|either)\b|.*\buses?\b)(?=.*\b(keys?|scrambl\w*|meaningless|unreadable|plain\s*text|ciph\w*|cyph\w*)\b).*$/i],
      distractors: ["They both use the same key", "They both use a public key", "They both send the key"],
      example: "Example question: give one similarity between a bike lock and a padlock.\nStep 1: list what each one does: both lock something, both need a key or code to open.\nStep 2: check each idea is true for BOTH.\nStep 3: \"both need a key to open\" is true for both, so it is a similarity.\nNow your question: what is true of symmetric AND asymmetric encryption?",
      working: ["What do both methods turn plain text into?", "What do both methods use to encrypt?"],
      note: "From the mark scheme: they both use a key; they both make the data meaningless; they both turn plain text into cipher text." },
    { id: "c-07", category: "cm-why", prompt: "Ana and a shop have never met. Why is asymmetric encryption better for them than symmetric encryption?", answers: ["The key that decrypts never has to be sent, so it cannot be intercepted"],
      keywords: [/^(?=.*\b(private|key\s+that\s+decrypts|decrypt\w*|keys?)\b)(?=.*\b(never|not|no|dont|doesnt|cant|isnt|wont|didnt|\w+n\Wt|without|stays?)\b)(?=.*\b(sent|sen[dt]\w*|shar\w*|exchang\w*|travel\w*|transmit\w*|intercept\w*|meet\w*)\b).*$/i],
      distractors: ["Asymmetric uses one key", "Asymmetric is faster", "Symmetric cannot be decrypted"],
      example: "Example question: why can a shop give its postbox address to strangers but not its key?\nStep 1: the address only lets people post things in.\nStep 2: the key lets people take things out, so it never leaves the shop.\nStep 3: strangers can send post safely without the key ever being handed over.\nNow your question: in asymmetric encryption, which key never has to travel, and why does that help people who have never met?",
      working: ["In symmetric encryption, what must be sent before the message?", "In asymmetric encryption, is the key that decrypts ever sent?"],
      note: "The private key never has to be sent, so there is no key exchange for Eve to intercept." },
    { id: "c-08", category: "cm-why", prompt: "Why is symmetric encryption less secure than asymmetric encryption?", answers: ["The key that decrypts must be sent to the receiver, so it can be intercepted"],
      keywords: [/^(?=.*\b(sent|sen[dt]\w*|shar\w*|transmit\w*|exchang\w*|travel\w*|give\w*|giv\w*)\b)(?=.*\b(intercept\w*|stolen|steal\w*|copied|hack\w*|someone|anyone|eve|attackers?|caught)\b).*$/i],
      distractors: ["It uses two keys", "It cannot make data meaningless", "Its cipher text is longer"],
      example: "Example question: why is posting a house key riskier than keeping it?\nStep 1: a posted key travels through places you cannot see.\nStep 2: anyone on the way could copy it.\nStep 3: a key that never travels cannot be copied on the way.\nNow your question: in symmetric encryption, what has to travel to the receiver, and what could happen to it?",
      working: ["How does the receiver get the symmetric key?", "What could happen to the key on the way?"],
      note: "The same key must be sent to the receiver, and anyone who intercepts it can decrypt the data." },
    { id: "c-09", category: "cm-why", prompt: "How many keys does asymmetric encryption use?", answers: ["Two"],
      keywords: [/^\s*(just\s+|only\s+)?(two|2)(\s+(different\s+)?keys?)?\s*\.?\s*$|^\s*(a\s+)?public\s*(key\s*)?(and|&)\s*(a\s+)?private(\s+key)?\s*\.?\s*$/i], distractors: ["One", "Three", "None"], format: "Type a number",
      example: "Example question: how many keys does symmetric encryption use?\nStep 1: the sender encrypts with a key.\nStep 2: the receiver decrypts with the same key.\nStep 3: the same key both times, so one key.\nNow your question: in asymmetric encryption, is the key that decrypts the same key that encrypts?",
      working: ["Which key encrypts?", "Which key decrypts? Is it the same one?"],
      note: "Two keys: a public key and a private key." }
  ];
}

// ---- Plenary: this lesson only, four categories that mirror its sections.
function plenaryCards() {
  var NAMES = ["Ana", "Ben", "Chen", "Dara", "Femi", "Hana", "Ivan", "Lina", "Omar", "Rosa"];
  function two() { var a = drillPick(NAMES), b = drillPick(NAMES.filter(function (n) { return n !== a; })); return [a, b]; }
  function own(name, kind) { return new RegExp("^\\s*(the\\s+)?(" + name + "\\W?s?\\s+" + kind + "(\\s*-?\\s*key)?|" + kind + "\\s+key\\s+(of|from|belonging\\s+to)\\s+" + name + ")\\s*\\.?\\s*$", "i"); }
  function yesNo(a) { return a === "Yes" ? /^\s*yes\b/i : /^\s*no\b/i; }
  var SYM = /^\s*(the\s+)?symmetric(\s+(key\s+)?encryption)?\s*\.?\s*$/i, ASYM = /^\s*(the\s+)?asymmetric(\s+(key\s+)?encryption)?\s*\.?\s*$/i;
  var SCEN = [
    ["Asymmetric encryption. Ben sends his public key to Ana. Eve intercepts it, then the cipher text.", "No", "The public key cannot decrypt."],
    ["Asymmetric encryption. Eve copies Ben's private key, then intercepts the cipher text.", "Yes", "The private key decrypts it."],
    ["Symmetric encryption. Ana sends the key, then the cipher text. Eve intercepts both.", "Yes", "The shared key decrypts it."],
    ["Asymmetric encryption. Ana encrypts with Eve's public key, thinking it is Ben's. Eve intercepts the cipher text.", "Yes", "Eve's private key matches Eve's public key."],
    ["Symmetric encryption. Ana and Ben agreed the key in person. Eve intercepts the cipher text.", "No", "Eve has no key."]
  ];
  var STATE = [
    ["One key encrypts and decrypts.", "Symmetric"], ["The key that decrypts is never sent.", "Asymmetric"], ["A public key and a private key are used.", "Asymmetric"],
    ["Both people must have the same key before the message is sent.", "Symmetric"], ["Anyone can know the key that encrypts.", "Asymmetric"],
    ["The key must be sent to the receiver so they can decrypt.", "Symmetric"]
  ];
  var DIFF = /^(?=.*\bsymmetric\b)(?=.*\basymmetric\b)(?!.*\bsymmetric\s+(uses?|has)\s+(two|different|a\s+public|public)\b)(?!.*\basymmetric\s+(uses?|has)\s+(one|a\s+single|the\s+same|a\s+shared)\b)(?!.*\bsymmetric\s+is\s+more\s+secure\b)(?=.*\b(one|single|same|two|different|public|private|shared|less\s+secure|more\s+secure|sent|sends?|not\s+sent)\b).*$/i;
  return [
    // ================================================= Why two keys?
    { id: "pl-01", category: "pl-why", prompt: "What is the weak point of symmetric encryption?", answers: ["The key must be sent, and it can be intercepted"],
      keywords: [/^(?=.*\b(shar\w*|sen[dt]\w*|transmi\w*|giv\w*|pass\w*|getting|get|swap\w*|exchang\w*|deliver\w*|intercept\w*|stolen)\b)(?=.*\bkeys?\b).*$/i],
      distractors: ["The cipher text is too long", "It uses two keys", "The algorithm is slow"],
      working: ["Both people need the same key. How does the receiver get it?", "What could happen to the key on the way?"],
      note: "The same key must reach the receiver, and it could be intercepted on the way." },
    { id: "pl-02", category: "pl-why", prompt: "In asymmetric encryption, why can the public key be given to anyone?", answers: ["It can only encrypt; it cannot decrypt"],
      keywords: [/^(?=.*\b(cannot|can.?t|unable|not|never|only|does\s*n.?t|doesnt)\b)(?=.*\b(decrypt\w*|unlock\w*|read\w*|undo\w*|encrypt\w*)\b).*$/i],
      distractors: ["It is kept secret", "It is too long to copy", "Nobody can intercept it"],
      working: ["What can someone do with a public key?", "Can it turn cipher text back into plain text?"],
      note: "The public key only encrypts. It cannot decrypt, so it is safe for anyone to have." },
    { id: "pl-03", category: "pl-why", prompt: "Why does the private key never need to be sent?", answers: ["Only the receiver decrypts, and the receiver already has it"],
      keywords: [/^(?=.*\b(already|keeps?|kept|own|owner|made|makes|created|creates|stays?|holds?)\b)(?=.*\b(receiver|owner|reader|person|they|he|she|only|their|his|her)\b)(?=.*\b(decrypt\w*|read\w*|has|have|needs?|uses?|made|makes|created|own)\b).*$/i],
      distractors: ["It is sent inside the cipher text", "It is the same as the public key", "Nobody uses it"],
      working: ["Who is the only person who decrypts the message?", "Where is the private key already?"],
      note: "The receiver made it and keeps it, and nobody else needs to decrypt." },
    { id: "pl-04", category: "pl-why", prompt: "Eve intercepts Ben's public key on its way to Ana. Why is that no problem?", answers: ["The public key cannot decrypt the cipher text"],
      keywords: [/^(?=.*\b(cannot|can.?t|unable|not|never|only|does\s*n.?t|doesnt)\b)(?=.*\b(decrypt\w*|unlock\w*|read\w*|undo\w*|encrypt\w*)\b).*$/i],
      distractors: ["Ana will not use it", "It is sent twice", "Eve does not want it"],
      working: ["What can a public key be used for?", "Which key would Eve need to decrypt Ana's message?"],
      note: "The public key only encrypts. Decrypting needs Ben's private key, which was never sent." },
    { id: "pl-05", category: "pl-why", prompt: "Give one reason why a person would use asymmetric encryption instead of symmetric encryption.", answers: ["It is more secure"],
      keywords: [/^(?!.*\b(not|less)\s+(more\s+)?(secure|safe))(?:.*\b(more|very|most|extra)\s+(secure|safe)\b|.*\b(safer|securer)\b|(?=.*\bkeys?\b)(?=.*\b(no|not|dont|doesnt|cant|isnt|wont|didnt|\w+n\Wt|never|without)\b)(?=.*\b(exchang\w*|shar\w*|sen[dt]\w*|swap\w*|transmit\w*|intercept\w*|stolen|travel\w*)\b)).*$/i],
      distractors: ["It is faster", "It uses only one key", "It needs no keys"],
      working: ["What is the weak point of symmetric encryption?", "Does asymmetric encryption have that weak point?"],
      note: "From 0478/11 June 2025 Q6(b): the process is more secure; there is no need to worry about key exchange." },
    // ================================================= Which key?
    { id: "pl-06", category: "pl-keys", prompt: "In asymmetric encryption, which key is used to encrypt the data?", answers: ["Public key"],
      keywords: [/^\s*(the\s+|a\s+)?(receiver\W?s\s+)?public(\s*-?\s*key)?\s*\.?\s*$/i], distractors: ["The private key", "The shared key", "No key"],
      working: ["Which key can anyone have?", "That key can only do one job. Which?"],
      note: "The receiver's public key encrypts the data." },
    { id: "pl-07", category: "pl-keys", prompt: "In asymmetric encryption, which key is used to decrypt the data?", answers: ["Private key"],
      keywords: [/^\s*(the\s+|a\s+)?(receiver\W?s\s+)?private(\s*-?\s*key)?\s*\.?\s*$/i], distractors: ["The public key", "The shared key", "No key"],
      working: ["Which key does only the receiver have?", "The other key cannot decrypt."],
      note: "The receiver's private key decrypts the data." },
    { id: "pl-08", category: "pl-keys", prompt: "How many keys does asymmetric encryption use?", answers: ["Two"],
      keywords: [/^\s*(just\s+|only\s+)?(two|2)(\s+(different\s+)?keys?)?\s*\.?\s*$|^\s*(a\s+)?public\s*(key\s*)?(and|&)\s*(a\s+)?private(\s+key)?\s*\.?\s*$/i], distractors: ["One", "Three", "None"], format: "Type a number",
      working: ["Which key encrypts? Which key decrypts?", "Are they the same key?"],
      note: "Two keys: a public key and a private key." },
    { id: "pl-09", category: "pl-keys", format: "Type whose key and which key, for example: Rosa's public key", randomize: function () {
        var p = two(), s = p[0], r = p[1];
        return { prompt: s + " sends a secret message to " + r + " using asymmetric encryption. Which key does " + s + " use to encrypt it?", answers: [r + "'s public key"], keywords: [own(r, "public")],
          distractors: [r + "'s private key", s + "'s public key", s + "'s private key"],
          working: ["Who will read the message?", "Which of that person's keys can anyone use to encrypt?"],
          note: r + "'s public key, so only " + r + "'s private key can decrypt it." };
      } },
    { id: "pl-10", category: "pl-keys", format: "Type whose key and which key, for example: Rosa's private key", randomize: function () {
        var p = two(), s = p[0], r = p[1];
        return { prompt: s + " encrypts a message with " + r + "'s public key. Which key decrypts it?", answers: [r + "'s private key"], keywords: [own(r, "private")],
          distractors: [r + "'s public key", s + "'s private key", s + "'s public key"],
          working: ["A public key cannot decrypt.", "Which private key matches the public key used?"],
          note: r + "'s private key is the only key that decrypts it." };
      } },
    { id: "pl-11", category: "pl-keys", prompt: "The image data is encrypted using symmetric encryption. Give one other type of encryption that could be used.", answers: ["Asymmetric"],
      keywords: [/^\s*(an?\s+)?(asymmetric|asynchronous)(\s+(key\s+)?encryption)?\s*\.?\s*$|^\s*public\s*(key\s*)?(and|&|\/)\s*private\s*key(\s+encryption)?\s*\.?\s*$/i], distractors: ["Symmetric", "Parallel", "Serial"],
      working: ["Symmetric uses one shared key.", "Which method uses two different keys?"],
      note: "From 0478/11 November 2025 Q2(e)(ii): asymmetric." },
    // ================================================= Who can read it?
    { id: "pl-12", category: "pl-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"],
          working: ["Which key decrypts the message in this method?", "Does Eve have that key?"], note: s[1] + ". " + s[2] };
      } },
    { id: "pl-13", category: "pl-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"],
          working: ["List what Eve has: which keys, and the cipher text?", "She can read it only with the key that decrypts."], note: s[1] + ". " + s[2] };
      } },
    { id: "pl-14", category: "pl-read", randomize: function () {
        var a = drillPick(NAMES), rest = NAMES.filter(function (n) { return n !== a; }), b = drillPick(rest), c = drillPick(rest.filter(function (n) { return n !== b; }));
        return { prompt: a + " writes to " + b + " but encrypts the message with " + c + "'s public key by mistake. Who can decrypt it?", answers: [c], keywords: [new RegExp("^\\s*(only\\s+)?" + c + "(\\W?s?\\s+private\\s+key)?(\\s+only)?\\s*\\.?\\s*$", "i")],
          distractors: [a, b, "Nobody"], format: "Type a name",
          working: ["Whose public key was used?", "Only the matching private key decrypts. Who has it?"],
          note: "Only " + c + "'s private key decrypts it, so only " + c + " can read it." };
      } },
    { id: "pl-15", category: "pl-read", prompt: "Eve has Ben's public key and the cipher text. Which key does she still need to read the message?", answers: ["Ben's private key"],
      keywords: [/^\s*(the\s+)?(ben\W?s?\s+)?private(\s*-?\s*key)?(\s+of\s+ben)?\s*\.?\s*$/i], distractors: ["Ben's public key", "Eve's public key", "A shared key"],
      working: ["The public key cannot decrypt.", "Which key matches Ben's public key?"],
      note: "Ben's private key, which never leaves Ben." },
    // ================================================= Symmetric and asymmetric
    { id: "pl-16", category: "pl-compare", randomize: function () {
        var s = drillPick(STATE);
        return { prompt: "\"" + s[0] + "\"\nIs this statement about symmetric or asymmetric encryption?", answers: [s[1]], keywords: [s[1] === "Symmetric" ? SYM : ASYM],
          distractors: [s[1] === "Symmetric" ? "Asymmetric" : "Symmetric"],
          working: ["One shared key, or two different keys?", "Is the key that decrypts ever sent?"], note: s[1] + "." };
      } },
    { id: "pl-17", category: "pl-compare", randomize: function () {
        var s = drillPick(STATE);
        return { prompt: "\"" + s[0] + "\"\nSymmetric or asymmetric?", answers: [s[1]], keywords: [s[1] === "Symmetric" ? SYM : ASYM],
          distractors: [s[1] === "Symmetric" ? "Asymmetric" : "Symmetric"],
          working: ["How many keys does it talk about?", "Symmetric: one shared key. Asymmetric: a public key and a private key."], note: s[1] + "." };
      } },
    { id: "pl-18", category: "pl-compare", prompt: "Give one similarity between symmetric encryption and asymmetric encryption.", answers: ["They both use a key"],
      keywords: [/^(?!.*\b(same|one|single|shared|two|public|private)\s+keys?\b)(?!.*\b(sen[dt]\w*|shar\w*)\b)(?=.*\b(both|each|they|all|same|similar\w*|either)\b|.*\buses?\b)(?=.*\b(keys?|scrambl\w*|meaningless|unreadable|plain\s*text|ciph\w*|cyph\w*)\b).*$/i],
      distractors: ["They both use the same key", "They both use a public key", "They both send the key"],
      working: ["What do both methods use to encrypt?", "What do both turn plain text into?"],
      note: "From 0478/13 November 2024 Q2(g)(ii): both use a key; both make the data meaningless; both turn plain text into cipher text." },
    { id: "pl-19", category: "pl-compare", prompt: "Give one difference between symmetric encryption and asymmetric encryption.", answers: ["Symmetric uses one key, whereas asymmetric uses two keys"],
      keywords: [DIFF], distractors: ["Symmetric uses two keys, asymmetric uses one key", "Symmetric is more secure than asymmetric", "Only asymmetric makes data meaningless"],
      working: ["Count the keys in each method.", "Name both methods in one sentence, with \"whereas\"."],
      note: "From 0478/13 November 2024 Q2(g)(iii): one key against two keys; the key sent with the data or not; the same key or a different key to decrypt; less secure against more secure." },
    { id: "pl-20", category: "pl-compare", prompt: "Why is symmetric encryption less secure than asymmetric encryption?", answers: ["The key that decrypts must be sent to the receiver, so it can be intercepted"],
      keywords: [/^(?=.*\b(sent|sen[dt]\w*|shar\w*|transmit\w*|exchang\w*|travel\w*|giv\w*)\b)(?=.*\b(intercept\w*|stolen|steal\w*|copied|hack\w*|someone|anyone|eve|attackers?|caught)\b).*$/i],
      distractors: ["It uses two keys", "It cannot make data meaningless", "Its cipher text is longer"],
      working: ["How does the receiver get the symmetric key?", "What could happen to it on the way?"],
      note: "The same key must be sent to the receiver, and anyone who intercepts it can decrypt the data." }
  ];
}

const DRILLS = [
  ['y10-2-3-l2-ext', 'Do Now Extension: 2.1 Data Transmission, 2.2 Methods of Error Detection and 2.3 L1 Symmetric Encryption. Every card has an example on different details and two nudges.',
    'Year 10 Extension: Transmission, Errors and Symmetric Encryption', '2.3 L2 Do Now Extension',
    [['ex-trans', 'Data Transmission (2.1)'], ['ex-errors', 'Methods of Error Detection (2.2)'], ['ex-enc', 'Symmetric Encryption (2.3 L1)']], extCards],
  ['y10-2-3-l2-keys', 'Activity 1: which key encrypts, which key decrypts, and who can read each message.',
    'Year 10, 2.3 L2: Which Key?', 'Cambridge IGCSE Computer Science 0478',
    [['k-which', 'Which Key?'], ['k-read', 'Who Can Read It?'], ['k-why', 'Why?']], keysCards],
  ['y10-2-3-l2-compare', 'Activity 2: symmetric or asymmetric? Statements, who can read it, and why.',
    'Year 10, 2.3 L2: Symmetric or Asymmetric?', 'Cambridge IGCSE Computer Science 0478',
    [['cm-which', 'Symmetric or Asymmetric?'], ['cm-read', 'Can Eve Read It?'], ['cm-why', 'Why?']], compareCards],
  ['y10-2-3-l2', 'Plenary: why two keys, which key does what, who can read it, and symmetric against asymmetric.',
    'Year 10, 2.3 L2: Asymmetric Encryption', 'Cambridge IGCSE Computer Science 0478',
    [['pl-why', 'Why Two Keys?'], ['pl-keys', 'Which Key?'], ['pl-read', 'Who Can Read It?'], ['pl-compare', 'Symmetric and Asymmetric']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|digital certificate|\bSSL\b|key pair/i.test(src), `drill ${id} names an unwanted term`);
  if (id.endsWith('-ext')) assert(!/asymmetric|public key|private key/i.test(fn.toString() + title + subtitle + about),`extension drill ${id} names a term taught later`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes, no distractor passes, and no example or working step gives the
// answer away. Then the explanation cards against more right and wrong answers.
const loaded = {};
{
  const vm = await import('node:vm');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    loaded[id] = d;
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids unique`);
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans + '.', ans.replace(/'/g, '')].forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors`);
        if (r.example && ans.length >= 3) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
  const card = (id, cid) => loaded[id].cards.find((c) => c.id === cid);
  const tk = (id, cid, yes, no) => {
    const c = card(id, cid);
    yes.forEach((s) => assert(c.keywords.some((k) => k.test(s)), `${id} ${cid} rejects "${s}"`));
    no.forEach((s) => assert(!c.keywords.some((k) => k.test(s)), `${id} ${cid} accepts "${s}"`));
  };
  tk('y10-2-3-l2-ext', 'ex-01', ['only that packet is sent again', 'just the lost one has to be resent', 'not the whole file is sent again'], ['it is faster', 'packets are small', 'the packet is lost']);
  tk('y10-2-3-l2-ext', 'ex-03', ['data only goes one way', 'it only travels in one direction', 'the computer never sends back'], ['it is simplex', 'it is fast', 'data goes both ways']);
  tk('y10-2-3-l2-ext', 'ex-05', ['so the sender can compare it with the original', 'to check it matches the data that was sent', 'the sender sees if it is the same as what it sent'], ['to check for errors', 'so it gets there', 'to send it again']);
  tk('y10-2-3-l2-ext', 'ex-06', ['to tell the sender the data arrived', 'so the sender knows it was received correctly', 'it confirms there were no errors'], ['to send the data', 'to check parity', 'it is a timeout']);
  tk('y10-2-3-l2-ext', 'ex-07', ['to compare it with the one typed in to find mistakes', 'if they are different there is an error', 'to see if it matches, so typing errors are found'], ['to check the number', 'to make it longer', 'it is the last digit']);
  tk('y10-2-3-l2-keys', 'k-07', ['the public key cannot decrypt', "she needs Ben's private key", "only Ben's private key can decrypt it", "a public key doesn't decrypt"], ['it is encrypted', 'she has the public key', 'the public key decrypts it']);
  tk('y10-2-3-l2-keys', 'k-08', ['it can only encrypt', 'it cannot decrypt messages', "it doesn't decrypt anything"], ['it is public', 'Eve is nice', 'it encrypts messages']);
  tk('y10-2-3-l2-keys', 'k-09', ["so only Ben's private key can decrypt it", 'only Ben has the private key to read it', 'he has the matching private key'], ['because it is safer', 'her key is old', 'Ben asked her']);
  tk('y10-2-3-l2-keys', 'k-10', ['the receiver already has it and only they decrypt', 'only the owner decrypts and they keep it', 'Ben made it and keeps it to decrypt'], ['it is public', 'it is sent later', 'it is too big']);
  tk('y10-2-3-l2-compare', 'c-06', ['they both use a key', 'both make the data meaningless', 'both turn plain text into cipher text', 'they both scramble the data'], ['they both use the same key', 'both use a public key', 'they both send the key', 'both use two keys', 'they are fast']);
  tk('y10-2-3-l2-compare', 'c-07', ['the private key is never sent', 'the key that decrypts does not have to be sent so it cannot be intercepted', 'no key needs to be exchanged'], ['it is more secure', 'it uses two keys', 'the public key is sent']);
  tk('y10-2-3-l2-compare', 'c-08', ['the key has to be sent and could be intercepted', 'someone could steal the shared key when it is sent', 'the key is shared so anyone who intercepts it can read the data'], ['it uses one key', 'it is old', 'it can be intercepted']);
  tk('y10-2-3-l2', 'pl-19', ['symmetric uses one key whereas asymmetric uses two', 'symmetric uses the same key to decrypt, asymmetric uses a different key', 'symmetric is less secure than asymmetric', 'asymmetric uses a public and private key, symmetric uses one key', 'symmetric sends the key, asymmetric does not'],
    ['symmetric uses two keys and asymmetric uses one', 'symmetric is more secure', 'they both use keys', 'asymmetric uses one key', 'asymmetric is different']);
  tk('y10-2-3-l2', 'pl-05', ['it is more secure', 'safer', 'no need to send the key', 'you do not have to worry about key exchange'], ['it is faster', 'more keys', 'it is not secure']);
  tk('y10-2-3-l2', 'pl-14', [], []);
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '2.3 L2: Asymmetric Encryption', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it straight after y10-2-3-l1 in the Year 10 "2.3" unit. Read the file at the last moment (other builders
// edit it too) and write it back with its own indent and line endings.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
const unit = y10.units.find((u) => u.code === '2.3');
assert(unit && unit.lessons.includes('y10-2-3-l1'), 'the 2.3 unit with y10-2-3-l1 must exist');
if (!unit.lessons.includes(ID)) {
  unit.lessons.splice(unit.lessons.indexOf('y10-2-3-l1') + 1, 0, ID);
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 2.3 lessons: ${unit.lessons.join(', ')}`);
