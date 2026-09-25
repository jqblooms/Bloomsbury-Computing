import fs from 'node:fs';

const topicId = 'y10-2-1-l1';
const steps = [];
const validators = {};
const regex = (source, flags = 'i') => ({ __regex: true, source, flags });
const add = step => steps.push(step);
const heading = (title, lead = '') => `<h2 class="lesson-h2">${title}</h2>${lead ? `<p class="lesson-lead">${lead}</p>` : ''}`;

function choice(id, label, lead, items) {
  add({ id, label, type: 'multiple-choice', containerId: `y10-21l1-${id}`,
    content: heading(label, lead) + `<div id="y10-21l1-${id}"></div>`, items });
}

function short(id, label, lead, questions, checks) {
  const validatorId = `y10-21l1-${id}`;
  const validatorKey = `y10_2_1_l1_${id.replaceAll('-', '_')}`;
  validators[validatorKey] = checks.map((check, i) => ({ suffix: String.fromCharCode(97 + i), pattern: regex(check.pattern), feedback: check.feedback }));
  const responses = questions.map((question, i) => {
    const suffix = String.fromCharCode(97 + i);
    return `<div class="lesson-do-now-response"><label for="${validatorId}-${suffix}">${question}</label><input id="${validatorId}-${suffix}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${suffix}" aria-label="${label}, part ${suffix}" autocomplete="off"></div>`;
  }).join('');
  const marks = questions.length;
  add({ id, label, type: 'short-answer-validation', validatorId, validatorKey,
    content: heading(label, lead) + `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${responses}</div><div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${validatorId}-check">Check answers</button><strong>Total: ${marks} mark${marks === 1 ? '' : 's'}</strong></div><div id="${validatorId}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>` });
}

function written(id, label, lead, items) {
  add({ id, label, type: 'self-marked-response', containerId: `y10-21l1-${id}`,
    content: heading(label, lead) + `<div id="y10-21l1-${id}"></div>`, items });
}

function activity(id, label, lead, appId) {
  add({ id, label, type: 'embedded-app', appId, embedContainerId: `y10-21l1-${id}`,
    content: heading(label, lead) + `<div id="y10-21l1-${id}"></div>` });
}

choice('do-now-1', 'Do Now: Compression',
  'Recap of 1.3 L3: Compression. Cambridge IGCSE 0478/11, June 2022, Question 1(a)(ii). Jack has an MP3 file stored on his computer.', [
    { prompt: 'Is the MP3 a lossy compressed file, a lossless compressed file, or not a compressed file? [1]',
      options: ['Lossless compressed file', 'Not a compressed file', 'Lossy compressed file'], correct: 2,
      explain: 'MP3 uses lossy compression: some sound data is permanently removed.' }
  ]);
short('do-now-2', 'Do Now: Lossless Compression',
  'Recap of 1.3 L3: Compression. Cambridge IGCSE 0478/13, June 2022, Question 6(d). Frida compresses a document. Repeating patterns are indexed, and no data is permanently removed.',
  ['Identify the type of compression Frida has used. [1]'], [
    { pattern: String.raw`^\s*lossless(\s+compression)?\s*$`, feedback: 'No data is permanently removed.' }
  ]);

add({ id: 'title', label: 'Data Packets and Packet Switching',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Data Transmission</p><h2 class="lesson-h2">Data Packets and Packet Switching</h2><p>Year 10, 2.1 L1 &middot; 55 minutes</p></div><ul class="lesson-facts"><li>Describe why a file is divided into packets.</li><li>Label the header, payload and trailer.</li><li>Follow packets across a network and put them back in order.</li></ul>' });

add({ id: 'why-packets', label: 'Why Split Data into Packets?',
  content: heading('Why Split Data into Packets?', 'To send a file across a network, the sender divides it into smaller pieces called packets.') +
    '<ul class="lesson-facts"><li>Each packet carries a <strong>part of the file</strong>.</li><li>Packets travel from the sender to the receiver.</li><li>The receiver puts the pieces together to rebuild the file.</li></ul><p class="lesson-lead">A large file may need many packets.</p>' });
choice('check-purpose', 'Check: Packets', 'Choose the best answer for each question.', [
  { prompt: 'What does the sender do to a file before transmitting it as packets?', options: ['Encrypt every character', 'Divide the file into smaller pieces', 'Store it in one packet'], correct: 1, explain: 'The file is divided into smaller packets before transmission.' },
  { prompt: 'What does the receiver do with the packets?', options: ['Rebuild the original file', 'Remove every header', 'Send the same file again'], correct: 0, explain: 'The receiver combines the packet payloads in the correct order.' }
]);

add({ id: 'packet-structure', label: 'Inside a Packet',
  content: heading('Inside a Packet', 'A packet has three parts:') +
    '<div class="lesson-exam-card" style="display:grid;grid-template-columns:2fr 1.4fr 1fr;gap:8px;text-align:center;font-weight:700"><div style="padding:12px;background:#dce9fb">Header</div><div style="padding:12px;background:#e7f5e9">Payload</div><div style="padding:12px;background:#fff0da">Trailer</div></div>' +
    '<ul class="lesson-facts"><li><strong>Header:</strong> destination address, originator address, packet number.</li><li><strong>Payload:</strong> part of the data being sent.</li><li><strong>Trailer:</strong> information used to check the packet for errors.</li></ul>' });
choice('exam-header', 'Exam Question: Packet Header',
  'Cambridge IGCSE 0478/11, June 2025, Question 5(c)(i). A customer sends an order to a restaurant kitchen in packets.', [
    { prompt: 'Which item would not be included in a packet\'s header? [1]',
      options: ['Destination address', 'Originator\'s address', 'Packet number', 'Payload'], correct: 3,
      explain: 'The payload is a separate part of the packet. The three other items are in its header.' }
  ]);
activity('build-packet', 'Activity 1: Build a Packet', 'Work through the five fields on your own. Check your choices, then correct any mistakes.', 'packet-lab-parts');

written('exam-packet-a', 'Exam Question: What Is in a Header?',
  'Cambridge IGCSE 0478/12, March 2023, Question 5(a)(i). A website request is sent using packet switching.', [
    { id: 'header-fields', prompt: 'Identify two items of data contained in a packet header. [2]', marks: 2,
      modelAnswer: 'Any two different items: destination address, originator address, packet number.' }
  ]);
written('exam-packet-b', 'Exam Question: The Other Two Parts',
  'Cambridge IGCSE 0478/12, March 2023, Question 5(a)(ii). The packet header is one of three elements.', [
    { id: 'other-parts', prompt: 'Identify the two other elements of a packet. [2]', marks: 2,
      modelAnswer: 'Payload and trailer.' }
  ]);

add({ id: 'packet-switching', label: 'How Packet Switching Works',
  content: heading('How Packet Switching Works', 'A file can reach the same destination through different network routes.') +
    '<ol class="lesson-facts"><li>The sender divides the file into numbered packets.</li><li>Routers choose a route for each packet.</li><li>Packets may take different routes and arrive out of order.</li><li>The receiver uses packet numbers to put them in order and rebuild the file.</li></ol>' });
choice('check-switching', 'Check: Follow the Route', 'Check both ideas before sending packets yourself.', [
  { prompt: 'What decides the route a packet takes through the network?', options: ['The payload', 'The receiving screen', 'A router'], correct: 2, explain: 'Routers direct packets towards their destination.' },
  { prompt: 'Packet 3 arrives before packet 2. What should the receiver use to rebuild the file?', options: ['The packet numbers', 'The arrival times', 'The originator address only'], correct: 0, explain: 'Packet numbers tell the receiver the original order.' }
]);
activity('route-packets', 'Activity 2: Route and Rebuild', 'Send the packets. Watch the arrival order, then rebuild each message using the packet numbers.', 'packet-lab-routes');

choice('check-reorder', 'Check: Why Reorder?', 'Use what you saw in the packet activity.', [
  { prompt: 'Why might a receiver need to reorder packets?',
    options: ['Routers can send packets by different routes, so arrival order may change', 'Every packet always follows the same route', 'The payload has no data'], correct: 0,
    explain: 'Different routes can take different amounts of time. The receiver uses packet numbers to rebuild the original order.' }
]);
short('practice', 'Checked Practice', 'Use the packet structure and route process from this lesson.', [
  'Which part of a packet contains the data being sent? [1]',
  'Which header item lets the receiver put packets back in their original order? [1]',
  'Which device chooses the route a packet takes? [1]'
], [
  { pattern: String.raw`^\s*(the\s+)?payload\s*$`, feedback: 'The data itself is carried in the middle part.' },
  { pattern: String.raw`^\s*(the\s+)?packet\s*(number|sequence\s+number)\s*$`, feedback: 'Look for the number in the packet header.' },
  { pattern: String.raw`^\s*(a\s+|the\s+)?router\s*$`, feedback: 'This network device directs packets towards their destination.' }
]);
activity('plenary', 'Plenary: Packets and Packet Switching', 'Complete a five-question drill batch. Your progress is saved for your teacher.', 'drill-y10-2-1-l1-packets');

const lesson = { id: topicId, label: '2.1 L1: Data Packets and Packet Switching', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(`LessonData/${topicId}.json`, JSON.stringify(lesson, null, 2) + '\n');
console.log(`Built ${topicId}: ${steps.length} steps, ${Object.keys(validators).length} validator groups`);
