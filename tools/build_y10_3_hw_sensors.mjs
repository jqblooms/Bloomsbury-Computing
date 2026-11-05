// Builds LessonData/y10-3-hw-sensors.json and its drill Drills/data/y10-3-hw-sensors.js: Year 10 homework on sensors,
// analogue and digital data, ADC and DAC, and how a microprocessor uses sensor data (syllabus 0478: sensors and
// automated systems). Teach then test: every teaching slide is a prediction with the reason after, two note slides,
// one AI-marked exam question, then the drill.
//   node tools/build_y10_3_hw_sensors.mjs
// It adds the lesson to the "3.1" unit after y10-3-1-l4. The drill is registered in the shell (js/registries.html).
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Slide:  0478/12 November 2022 Q2(a) (the automatic tap, AI-marked)
//   Drill:  0478/12 November 2022 Q2(b) (three systems); 0478/12 November 2023 Q11(a) (flow sensor);
//           0478/11 June 2023 Q5(a) (the water bowl)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-hw-sensors';
const PREV = 'y10-3-1-l4';
const P = 'y10-3hw';
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const NOTES = [];
function noteBox(q, model) {
  NOTES.push({ q, model });
  return `<details class="lesson-note"><summary><span class="lesson-note-q">Note in your notes: ${q}</span>` +
    `<span class="lesson-note-reveal">Check my note</span></summary><div class="lesson-note-a"><p><strong>A model note:</strong> ${model}</p></div></details>`;
}
function noteSlide(id, label, notes) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the notepad button at the top) and write each note in your own words. Then press <strong>Check my note</strong> and compare. Fix your note if it misses an idea.') +
    notes.map(([q, m]) => noteBox(q, m)).join('') };
}
function mcStep(id, label, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead || '') + (!extra ? `<div id="${cid}"></div>` : items.length > 1 ? extra + `<div id="${cid}" style="margin-top:8px"></div>` : `<div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;align-items:start"><div>${extra}</div><div id="${cid}"></div></div>`), items };
}
function written(id, label, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + `<p class="lesson-lead">${lead}</p>` + extra + `<div id="${cid}"></div>`, items };
}
function embed(id, label, appId, lead) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
const table = (head, rows) => {
  const cell = 'padding:2px 8px;border-bottom:1px solid var(--line);text-align:left';
  return `<table style="border-collapse:collapse;font-size:15px;margin:0"><tr>${head.map((h) => `<th style="${cell};font-size:13px;color:var(--muted)">${h}</th>`).join('')}</tr>` +
    rows.map((r) => `<tr>${r.map((c) => `<td style="${cell}">${c}</td>`).join('')}</tr>`).join('') + '</table>';
};
const box = (h, rows) => `<div style="border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2);padding:6px 12px"><b>${h}</b>` +
  rows.map((r) => `<div style="margin-top:3px">${r}</div>`).join('') + '</div>';
const cmp = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0">${box(...a)}${box(...b)}</div>`;
const PREDICT = 'read the slide, then pick your prediction. The reason appears under it.';
const steps = [];

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Homework: Sensors, Analogue and Digital',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Homework</p><h2 class="lesson-h2">Sensors, Analogue and Digital</h2><p>Year 10</p></div>' +
    facts(['<strong>Part 1:</strong> learn. On each slide, <strong>predict</strong> by picking an answer, then read why.', '<strong>Part 2:</strong> a test drill at the end. It saves your progress.', 'About one hour. Write your notes when a slide asks.']) +
    tps('A shop door opens by itself when you walk up to it. How do you think the door knows you are there?', 'Something in the door system measures what is in front of it. You will find out what it is called, and how it works.') });

// ---------------------------------------------------------------- sensors
steps.push(mcStep('what-sensor', 'What Is a Sensor?', todo(PREDICT) +
  facts(['A phone screen gets brighter when you go out into the sun.', 'Nobody pressed a button. A small part in the phone measured the light.']), [
    { prompt: 'Predict: what does that small part do?', options: ['It makes light for the screen', 'It measures the light and sends the reading to the phone', 'It stores photos taken in the sun'], correct: 1,
      explain: 'It measures something in the world around it (here, light) and sends the reading to the computer in the phone. A part that does this is called a <strong>sensor</strong>. A sensor is an input device: it sends data into the computer.' },
  ]));
steps.push(mcStep('why-sensor', 'Why Use a Sensor?', todo(PREDICT) +
  facts(['A greenhouse must stay warm all day and all night.', 'A sensor can measure the temperature every second.']), [
    { prompt: 'Predict: why use a sensor and not a person checking a thermometer?', options: ['A sensor never needs any power at all', 'A sensor takes readings all the time, day and night', 'A person cannot read a thermometer'], correct: 1,
      explain: 'A sensor never gets tired and never forgets. It can take a reading every second, all day and all night, and it is more accurate. A person cannot check that often.' },
  ]));
const S1 = [['Temperature', 'how hot or cold it is'], ['Light', 'how bright it is'], ['Moisture', 'how wet the soil is'], ['Humidity', 'how much water vapour is in the air'],
  ['pH', 'how acidic or alkaline it is'], ['Pressure', 'how hard something presses on it'], ['Gas', 'how much of a gas there is, such as carbon dioxide']];
const S2 = [['Acoustic', 'sound: how loud it is'], ['Accelerometer', 'speeding up, slowing down and tilting'], ['Flow', 'how much liquid or gas flows through a pipe'], ['Level', 'how high a liquid is in a tank'],
  ['Infra-red', 'infra-red light, such as body heat, or a beam being broken'], ['Magnetic field', 'a magnetic field, such as a magnet near it'], ['Proximity', 'how close an object is']];
steps.push(mcStep('sensors-1', 'Common Sensors (1 of 2)', todo('read the table, then pick your prediction. The reason appears under it.'), [
    { prompt: 'Predict: a farmer wants to know when the soil in a field is too dry. Which sensor fits best?', options: ['Humidity', 'Moisture', 'Pressure'], correct: 1,
      explain: 'Moisture. A moisture sensor measures water in the soil. Humidity is water vapour in the air, not in the soil.' },
  ], table(['Sensor', 'What it measures'], S1)));
steps.push(mcStep('sensors-2', 'Common Sensors (2 of 2)', todo('read the table, then pick your prediction. The reason appears under it.'), [
    { prompt: 'Predict: a phone turns the picture round when you turn the phone on its side. Which sensor fits best?', options: ['Proximity', 'Acoustic', 'Accelerometer'], correct: 2,
      explain: 'Accelerometer. It measures movement and tilting, so the phone knows it has been turned. Proximity measures how close something is.' },
  ], table(['Sensor', 'What it measures'], S2)));
steps.push(noteSlide('note-sensor', 'Your Notes: Sensors', [
  ['in your own words, say what a sensor is.', 'A sensor is an input device. It measures something in the world around it, such as temperature or light, and sends the reading to a computer.'],
  ['explain WHY a system uses a sensor and not a person.', 'A sensor takes readings all the time, day and night, and is more accurate. A person gets tired and cannot check that often.']]));

// ---------------------------------------------------------------- analogue and digital
steps.push(mcStep('analogue', 'Readings That Change Smoothly', todo(PREDICT) +
  facts(['A room warms up from 21 &deg;C to 22 &deg;C.', 'On the way, it is 21.3 &deg;C, then 21.34 &deg;C, then 21.341 &deg;C ...']), [
    { prompt: 'Predict: how many different temperatures are there between 21 and 22?', options: ['Only 2', 'Exactly 10', 'No limit: any value'], correct: 2,
      explain: 'There is no limit. The temperature changes smoothly and can be any value, with no gaps. Data like this is called <strong>analogue</strong> data. Temperature, sound and light in the real world are analogue.' },
  ]));
steps.push(mcStep('digital', 'Data Inside a Computer', todo(PREDICT) +
  facts(['A computer stores everything in binary: 1s and 0s.', 'A register holds a fixed number of bits, such as 8.']), [
    { prompt: 'Predict: 8 bits can hold 256 different patterns. Can 8 bits hold every temperature between 21 and 22?', options: ['Yes, every one of them', 'No: only some separate values', 'Yes, if the bits are big'], correct: 1,
      explain: 'No. Binary has separate steps with gaps between them, so it can only hold some values. Data stored as separate values in binary is called <strong>digital</strong> data.' },
  ]));
steps.push(mcStep('compare-ad', 'Compare: Analogue or Digital?', todo('compare the two boxes, then pick a prediction for each question. The reason appears under each one.') +
  cmp(['Analogue', ['Changes smoothly.', 'Any value, no gaps.']], ['Digital', ['Separate values, in steps.', 'Stored in binary.']]), [
    { prompt: 'The sound of your voice moving through the air. Which is it?', options: ['Analogue', 'Digital'], correct: 0,
      explain: 'Analogue. The air pressure changes smoothly, with no gaps.' },
    { prompt: 'The number 01101001 stored in a register. Which is it?', options: ['Analogue', 'Digital'], correct: 1,
      explain: 'Digital. It is binary: separate values with nothing in between.' },
  ]));
steps.push(mcStep('why-digital', 'Why the Microprocessor Needs Digital', todo(PREDICT) +
  facts(['A <strong>microprocessor</strong> is a small CPU built into a device, such as a washing machine.', 'Like every CPU, it only works with binary.']), [
    { prompt: 'Predict: a temperature sensor gives an analogue reading. Can the microprocessor process it as it is?', options: ['Yes, a CPU can use any data', 'No: it must be turned into binary first', 'Yes, but only at night'], correct: 1,
      explain: 'No. A CPU or microprocessor can only process digital (binary) data. An analogue reading has no separate values, so it must be changed into binary first.' },
  ]));

// ---------------------------------------------------------------- ADC and DAC
steps.push(mcStep('adc', 'Sensor In: The ADC', todo(PREDICT) +
  facts(['The sensor gives analogue data.', 'The microprocessor needs digital data.']), [
    { prompt: 'Predict: what must sit between the sensor and the microprocessor?', options: ['Something that turns analogue into digital', 'Something that turns digital into analogue', 'Nothing: they connect straight in'], correct: 0,
      explain: 'Something that turns analogue into digital. It is called an <strong>analogue to digital converter (ADC)</strong>. The ADC measures the reading and gives a binary number for it.' },
  ]));
steps.push(mcStep('dac', 'Output: The DAC', todo(PREDICT) +
  facts(['A microprocessor sends music to a speaker. The music is stored as binary.', 'A speaker makes sound by moving smoothly in and out.']), [
    { prompt: 'Predict: what must sit between the microprocessor and the speaker?', options: ['Something that turns analogue into digital', 'Something that turns digital into analogue', 'Another sensor, to hear the music'], correct: 1,
      explain: 'Something that turns digital into analogue. It is called a <strong>digital to analogue converter (DAC)</strong>. A motor that needs a smooth signal to change its speed can need a DAC too.' },
  ]));
steps.push(mcStep('compare-convert', 'Compare: ADC or DAC?', todo('pick a prediction for each question. Ask: which way is the data going? The reason appears under each one.') +
  cmp(['ADC', ['Analogue in, digital out.', 'Sensor to microprocessor.']], ['DAC', ['Digital in, analogue out.', 'Microprocessor to speaker or motor.']]), [
    { prompt: 'A microphone records your voice into a computer. Which converter is needed?', options: ['ADC', 'DAC'], correct: 0,
      explain: 'ADC. Your voice is analogue and goes into the computer, which needs digital.' },
    { prompt: 'A computer plays a video with sound through headphones. Which converter is needed?', options: ['ADC', 'DAC'], correct: 1,
      explain: 'DAC. The sound is stored as digital and must come out as analogue.' },
  ]));
steps.push(noteSlide('note-convert', 'Your Notes: ADC and DAC', [
  ['explain WHY a sensor reading must go through an ADC.', 'The sensor gives analogue data. The microprocessor can only process digital (binary) data, so the ADC turns analogue into digital.'],
  ['explain WHY a speaker needs a DAC.', 'The sound is stored as digital data. The speaker moves smoothly, so it needs analogue. The DAC turns digital into analogue.']]));

// ---------------------------------------------------------------- the microprocessor using sensor data
const GH = facts(['A greenhouse has a temperature sensor, a microprocessor and a heater.', 'The microprocessor stores the value 20 &deg;C.']);
steps.push(mcStep('control-1', 'Using Sensor Data: Compare', todo(PREDICT) + GH, [
    { prompt: 'Predict: the sensor reads 17 &deg;C. The ADC turns it into binary. What does the microprocessor do with it?', options: ['Compares it with the stored value 20', 'Stores it and does nothing else', 'Sends it back to the sensor'], correct: 0,
      explain: 'It compares the reading with the stored value. 17 is less than 20, so the greenhouse is too cold.' },
  ]));
steps.push(mcStep('control-2', 'Using Sensor Data: Act', todo(PREDICT) + GH, [
    { prompt: 'Predict: 17 is less than 20. What does the microprocessor do next?', options: ['Waits for a person to switch on the heater', 'Sends a signal to switch the heater on', 'Changes the stored value to 17'], correct: 1,
      explain: 'It sends a signal to switch the heater on. A device that the microprocessor switches on or off to make something happen is called an <strong>actuator</strong>. A motor, a pump and a valve are actuators too.' },
  ]));
steps.push(mcStep('control-3', 'Using Sensor Data: Repeat', todo(PREDICT) + GH, [
    { prompt: 'Predict: the heater is on. What does the system do next?', options: ['Stops: the job is done', 'Turns the sensor off to save power', 'Takes a new reading and checks again'], correct: 2,
      explain: 'It takes a new reading and checks again, over and over. When the reading reaches 20, the heater is switched off. The steps are: read, convert (ADC), compare, act, repeat.' },
  ]));
steps.push(mcStep('control-order', 'Check: The Steps in Order', todo('pick the best order. Done when it is answered.'), [
    { prompt: 'A water tank fills by itself. A level sensor is used. Which order is right?', options: ['Compare, read, convert, act, repeat', 'Read, convert, compare, act, repeat', 'Read, act, convert, compare, repeat'], correct: 1,
      explain: 'Read the level, convert it with the ADC, compare it with the stored level, act (switch the pump on or off), then repeat. You cannot compare a reading before it is read and converted.' },
  ]));

// ---------------------------------------------------------------- exam question: 0478/12 November 2022 Q2(a)
steps.push(written('exam-tap', 'Exam Question: The Automatic Tap',
  cite('0478/12, November 2022, Question 2(a)') + ' <strong>What to do:</strong> type your answer, then press <strong>Submit answer</strong>. Use the steps: read, convert, compare, act, repeat.', [
    { id: 'tap', prompt: 'An automated water tap system uses a sensor and a microprocessor to operate. Water flows from the tap when a person\'s hands are placed underneath the tap. Water stops flowing when the person\'s hands are removed from underneath the tap. Explain how the water tap system uses a sensor and a microprocessor to operate.', marks: 6,
      scheme: ['Motion/proximity/infra-red sensor is used', 'Sensor sends data to microprocessor', 'Data is converted from analogue to digital (using ADC)', 'Data is compared to stored/set value(s)',
        'If data is inside range/outside range/greater than/less than, signal is sent to turn water tap on', 'If data is outside range/inside range/less than/greater than, tap remains off // signal is sent to turn water tap off', 'Actuator is used to turn the tap off/on', 'Whole process is continuous'],
      guidance: 'Six from the points, one mark each.',
      modelAnswer: 'A proximity sensor sends data to the microprocessor. An ADC converts it to digital. It is compared with a stored value. If hands are near, a signal makes an actuator turn the tap on, otherwise off. This repeats continuously.' },
  ]));

steps.push(embed('test', 'Test: Sensors Drill', 'drill-' + ID,
  '<strong>What to do:</strong> answer every card. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.'));

// ---------------------------------------------------------------- the drill
const card = (id, category, prompt, answers, distractors, noteText, working, example, keywords) =>
  Object.assign({ id, category, prompt, answers, distractors, note: noteText, working, pickThenType: true }, example ? { example } : {}, keywords ? { keywords } : {});
const whole = (body) => [new RegExp('^\\s*(the\\s+|an?\\s+)?(' + body + ')\\s*\\.?\\s*$', 'i')];
const sens = (body) => whole('(' + body + ')(\\s*sensors?)?');
const ADC = '(adc|analog(ue)?\\s*(to|-|2)\\s*digital(\\s*convert(e|o)r)?)(\\s*\\(\\s*adc\\s*\\))?';
const DAC = '(dac|digital\\s*(to|-|2)\\s*analog(ue)?(\\s*convert(e|o)r)?)(\\s*\\(\\s*dac\\s*\\))?';
const AN = whole('analog(ue)?(\\s*data)?');
const DG = whole('digital(\\s*data)?');
const T = { temp: 'temperature', light: 'light', moist: 'moisture', hum: 'humidity', ph: 'p\\s*h', press: 'pressure', gas: 'gas', ac: 'acoustic|sound', acc: 'accelerometer', flow: 'flow', lev: 'level', ir: 'infra\\s*-?\\s*red|ir', mag: 'magnetic(\\s*field)?', prox: 'proximity' };
const cards = [
  // what a sensor is, and which sensor
  card('s-01', 'sensor', 'What is a sensor?', ['An input device that measures something in its surroundings'], ['An output device that moves something in its surroundings', 'A storage device that keeps readings for later use'], 'A sensor measures a physical quantity, such as temperature, and sends the data to a computer.',
    ['Does it send data into the computer, or out of it?', 'It measures something.'], 'A similar question: what is a speaker?\nStep 1: it gets data from the computer, so it is an output device.\nStep 2: it makes sound.\nNow your question: a sensor sends data into the computer. What does it do first?',
    [/(input|measure|detect|sense)/i]),
  card('s-02', 'sensor', 'A sensor sends data into a computer.\nIs a sensor an input device or an output device?', ['Input device'], ['Output device', 'Storage device'], 'Data goes into the computer, so a sensor is an input device.',
    ['Which way does the data go?', 'Into the computer is input.'], 'A similar question: is a printer an input or an output device?\nStep 1: the computer sends data to the printer.\nStep 2: data coming out of the computer means output.\nNow your question: which way does a sensor\'s data go?', whole('input(\\s*device)?')),
  card('s-03', 'sensor', 'Give one reason a system uses a sensor and not a person to check readings.', ['It takes readings all the time, day and night'], ['It never needs to be switched on', 'It makes the readings bigger'], 'A sensor never gets tired, takes readings very often and is more accurate.',
    ['Think about how often a person could check.', 'Does a sensor get tired or forget?'], null,
    [/(all the time|continu|24|day and night|never (gets )?tired|more (accurate|often)|accura|constant|frequent|faster|forget|rest|sleep|break)/i]),
  card('s-04', 'sensor', 'A greenhouse heater must switch on when it gets cold.\nWhich sensor is used?', ['Temperature sensor'], ['Light sensor', 'Humidity sensor', 'Pressure sensor'], 'A temperature sensor measures how hot or cold it is.',
    ['What is changing when it gets cold?', 'Which sensor measures hot and cold?'], 'A similar question: a street lamp switches on when it gets dark. Which sensor?\nStep 1: what changes? How bright it is.\nStep 2: the sensor that measures brightness is the light sensor.\nNow your question: what changes when it gets cold?', sens(T.temp)),
  card('s-05', 'sensor', 'A street lamp switches on when it gets dark.\nWhich sensor is used?', ['Light sensor'], ['Temperature sensor', 'Proximity sensor', 'Acoustic sensor'], 'A light sensor measures how bright it is.',
    ['What changes when it gets dark?', 'Which sensor measures brightness?'], 'A similar question: a fan switches on when a room gets hot. Which sensor?\nStep 1: what changes? How hot it is.\nStep 2: that is the temperature sensor.\nNow your question: what changes when it gets dark?', sens(T.light)),
  card('s-06', 'sensor', 'A car beeps when it reverses close to a wall.\nWhich sensor is used?', ['Proximity sensor'], ['Pressure sensor', 'Light sensor', 'Gas sensor'], 'A proximity sensor measures how close an object is.',
    ['The car does not touch the wall.', 'Which sensor measures how close something is?'], 'A similar question: a car checks that a seat has a person on it. Which sensor?\nStep 1: the person presses down on the seat.\nStep 2: that is a pressure sensor.\nNow your question: the car must know how close the wall is.', sens(T.prox + '|infra\\s*-?\\s*red|ultrasonic')),
  card('s-07', 'sensor', 'A burglar alarm sounds when a person walks through a beam in a doorway.\nWhich sensor is used?', ['Infra-red sensor'], ['Humidity sensor', 'Moisture sensor', 'Flow sensor'], 'An infra-red sensor detects body heat, or a beam of infra-red light being broken.',
    ['The beam is light you cannot see.', 'It can also detect body heat.'], 'A similar question: an alarm sounds when a window with a small magnet on it opens. Which sensor?\nStep 1: the magnet moves away.\nStep 2: that is a magnetic field sensor.\nNow your question: a beam of light you cannot see is broken.', sens(T.ir + '|motion')),
  card('s-08', 'sensor', 'A fish tank pump must keep the water in a tank at the right height.\nWhich sensor is used?', ['Level sensor'], ['Gas sensor', 'Light sensor', 'Acoustic sensor'], 'A level sensor measures how high a liquid is in a tank.',
    ['The height of the water is measured.', 'Which sensor measures how high a liquid is?'], 'A similar question: a factory checks how much water goes through a pipe each minute. Which sensor?\nStep 1: water is moving through a pipe.\nStep 2: that is a flow sensor.\nNow your question: the water is not moving; how high is it?', sens(T.lev + '|pressure')),
  card('s-09', 'sensor', 'A phone counts your steps when you walk.\nWhich sensor is used?', ['Accelerometer'], ['Magnetic field sensor', 'Light sensor', 'Gas sensor'], 'An accelerometer measures movement: speeding up, slowing down and tilting.',
    ['The phone moves with every step.', 'Which sensor measures movement and tilting?'], 'A similar question: a phone turns its screen off when it is held next to your ear. Which sensor?\nStep 1: the ear is close to the phone.\nStep 2: that is a proximity sensor.\nNow your question: the phone is moving with each step.', whole(T.acc + '(\\s*sensor)?')),
  card('s-10', 'sensor', 'A classroom alarm warns when there is too much carbon dioxide in the air.\nWhich sensor is used?', ['Gas sensor'], ['Humidity sensor', 'Pressure sensor', 'Light sensor'], 'A gas sensor measures how much of a gas, such as carbon dioxide, is in the air.',
    ['Carbon dioxide is a gas.', 'Humidity is water vapour only.'], 'A similar question: a room warns when the air is too damp. Which sensor?\nStep 1: damp air holds water vapour.\nStep 2: that is a humidity sensor.\nNow your question: what is carbon dioxide?', sens(T.gas + '|carbon\\s*dioxide|co2')),
  card('s-11', 'sensor', 'A system checks the air is dry enough in a garage that spray paints cars.\nIdentify the most suitable sensor.', ['Humidity sensor', 'Moisture sensor'], ['Light sensor', 'Gas sensor', 'Pressure sensor'], 'From Cambridge IGCSE 0478/12, November 2022, Question 2(b).',
    ['Dry air has little water vapour in it.', 'Which sensor measures water in the air?'], null, sens(T.hum + '|' + T.moist)),
  card('s-12', 'sensor', 'A system checks that the soil in a greenhouse has the correct level of acidity.\nIdentify the most suitable sensor.', ['pH sensor'], ['Moisture sensor', 'Temperature sensor', 'Level sensor'], 'From Cambridge IGCSE 0478/12, November 2022, Question 2(b).',
    ['Acidity is not wetness.', 'Which sensor measures acidic or alkaline?'], null, sens(T.ph)),
  card('s-13', 'sensor', 'A farm has an automated drinking system for its animals. When the water bowl is empty, it is automatically refilled.\nIdentify the most appropriate sensor for this system.', ['Level sensor', 'Pressure sensor', 'Moisture sensor'], ['Light sensor', 'Acoustic sensor', 'Gas sensor'], 'From Cambridge IGCSE 0478/11, June 2023, Question 5(a).',
    ['The system must know how much water is in the bowl.', 'Which sensor measures how high a liquid is?'], null, sens(T.lev + '|' + T.press + '|' + T.moist)),
  card('s-14', 'sensor', 'An automated system uses a flow sensor.\nIdentify what a flow sensor measures.', ['The amount of liquid or gas flowing through it'], ['The height of a liquid in a tank', 'The amount of water vapour in the air'], 'From Cambridge IGCSE 0478/12, November 2023, Question 11(a).',
    ['Flow means moving along.', 'It is liquid or gas moving through a pipe.'], null, [/(flow|mov|pass)/i]),
  // analogue and digital
  card('a-01', 'ad', 'Data that changes smoothly and can be any value in a range, with no gaps.\nWhat kind of data is this?', ['Analogue'], ['Digital', 'Binary'], 'Analogue data changes smoothly and can be any value.',
    ['There are no gaps between the values.', 'Real-world readings like temperature are this kind.'], 'A similar question: data stored as separate values in binary. What kind?\nStep 1: separate values means there are gaps.\nStep 2: that is digital data.\nNow your question: this data has no gaps.', AN),
  card('a-02', 'ad', 'Data that is stored as separate values, using binary.\nWhat kind of data is this?', ['Digital'], ['Analogue', 'Denary'], 'Digital data has separate values in steps, stored in binary.',
    ['Binary has separate values with gaps between them.', 'This is the data a computer can process.'], null, DG),
  card('a-03', 'ad', 'A thermometer reading changes from 21 to 22 degrees through 21.3, 21.34 and so on.\nIs this analogue or digital data?', ['Analogue'], ['Digital'], 'The temperature changes smoothly and can be any value: analogue.',
    ['Can it be any value between 21 and 22?', 'No gaps means one kind; gaps mean the other.'], 'A similar question: the number of people in a room, 1, 2, 3 ... Which kind?\nStep 1: it goes up in whole steps.\nStep 2: nothing in between, so it is digital.\nNow your question: can the reading be any value?', AN),
  card('a-04', 'ad', 'The binary number 01101001 is stored in a register.\nIs this analogue or digital data?', ['Digital'], ['Analogue'], 'Binary is separate values in steps: digital.',
    ['It is binary.', 'Binary has nothing in between its values.'], null, DG),
  card('a-05', 'ad', 'Sound moving through the air reaches a microphone.\nIs the sound analogue or digital?', ['Analogue'], ['Digital'], 'Sound in the air changes smoothly, so it is analogue.',
    ['It is a real-world quantity.', 'Does it change smoothly or in steps?'], null, AN),
  card('a-06', 'ad', 'What kind of data can a microprocessor process?', ['Digital data'], ['Analogue data', 'Any kind of data'], 'A microprocessor, like any CPU, only processes binary: digital data.',
    ['A microprocessor is a small CPU.', 'A CPU works with binary.'], null, DG),
  card('a-07', 'ad', 'Why can a microprocessor not process an analogue reading as it is?', ['It can only process binary, which has separate values'], ['It can only process readings that are very large', 'It can only process data typed in by a person'], 'Analogue has no separate values. The microprocessor only works with binary, so the reading must be converted first.',
    ['What does every CPU work with?', 'Does an analogue reading have separate values?'], null, [/(binary|digital|discrete|separate|0s? and 1s?|1s? and 0s?)/i]),
  card('a-08', 'ad', 'What is a microprocessor?', ['A small CPU built into a device'], ['A large memory built into a device', 'A sensor built into a device'], 'A microprocessor is a small CPU built into a device such as a washing machine or a car.',
    ['It processes data, like the CPU in a laptop.', 'It is small and inside a device.'], null, [/(cpu|central\s*processing|processor|process)/i]),
  // ADC and DAC
  card('c-01', 'convert', 'What does ADC stand for?', ['Analogue to digital converter'], ['Analogue data controller', 'Automatic digital converter'], 'ADC: analogue to digital converter.',
    ['A is for the kind of data that goes in.', 'D is for the kind of data that comes out.'], 'A similar question: what does DAC stand for?\nStep 1: D is digital, the data going in.\nStep 2: A is analogue, the data coming out, then C for converter.\nNow your question: the letters are the other way round.', [new RegExp('^\\s*(an?\\s+)?analog(ue)?\\s*(to|-|2)\\s*digital\\s*convert(e|o)r\\s*\\.?\\s*$', 'i')]),
  card('c-02', 'convert', 'What does DAC stand for?', ['Digital to analogue converter'], ['Digital analogue controller', 'Data to analogue converter'], 'DAC: digital to analogue converter.',
    ['D is for the kind of data that goes in.', 'A is for the kind of data that comes out.'], null, [new RegExp('^\\s*(an?\\s+)?digital\\s*(to|-|2)\\s*analog(ue)?\\s*convert(e|o)r\\s*\\.?\\s*$', 'i')]),
  card('c-03', 'convert', 'A temperature sensor sends a reading to a microprocessor.\nWhat must the reading go through first?', ['Analogue to digital converter (ADC)'], ['Digital to analogue converter (DAC)', 'Another sensor'], 'The reading is analogue. The microprocessor needs digital, so an ADC converts it.',
    ['The reading is analogue. The microprocessor needs digital.', 'Which converter turns analogue into digital?'], 'A similar question: a microprocessor sends music to a speaker. What does the music go through?\nStep 1: the music is stored as binary: digital.\nStep 2: the speaker needs analogue, so a converter from digital to analogue.\nNow your question: the data is going the other way.', whole(ADC)),
  card('c-04', 'convert', 'A microprocessor sends stored music to a speaker.\nWhat must the music go through first?', ['Digital to analogue converter (DAC)'], ['Analogue to digital converter (ADC)', 'A sensor'], 'The music is digital. The speaker moves smoothly, so it needs analogue: a DAC.',
    ['The music is stored as binary.', 'The speaker moves smoothly.'], 'A similar question: a microphone sends your voice into a computer. What does it go through?\nStep 1: your voice is analogue.\nStep 2: the computer needs digital, so a converter from analogue to digital.\nNow your question: the data is going the other way.', whole(DAC)),
  card('c-05', 'convert', 'A microphone records your voice into a computer.\nWhich converter is needed: ADC or DAC?', ['ADC'], ['DAC'], 'Your voice is analogue and goes into the computer, which needs digital: ADC.',
    ['Which way is the data going?', 'Into the computer means analogue to digital.'], null, whole(ADC)),
  card('c-06', 'convert', 'A computer plays sound through headphones.\nWhich converter is needed: ADC or DAC?', ['DAC'], ['ADC'], 'The sound is stored as digital and must come out as analogue: DAC.',
    ['Which way is the data going?', 'Out of the computer to headphones means digital to analogue.'], null, whole(DAC)),
  card('c-07', 'convert', 'What does an ADC do?', ['Turns analogue data into digital data'], ['Turns digital data into analogue data', 'Turns digital data into denary data'], 'An ADC turns analogue data (from a sensor) into digital data (for the microprocessor).',
    ['Read its name: analogue to digital.', 'Which kind of data goes in first?'], null, [new RegExp('analog(ue)?.*(in)?to.*digital', 'i')]),
  // the microprocessor using sensor data
  card('m-01', 'control', 'A greenhouse stores the value 20 degrees. The sensor reads 17 degrees, and the ADC converts it.\nWhat does the microprocessor do with the reading next?', ['Compares it with the stored value'], ['Sends it back to the sensor', 'Changes the stored value to it'], 'The microprocessor compares the reading with the stored value to decide what to do.',
    ['It must decide if the greenhouse is too cold.', 'What is the 20 there for?'], null, [/(compar|check|test).*(stor|set|20|value|preset)|(stor|set|preset).*(compar|check)/i]),
  card('m-02', 'control', 'The greenhouse reading is 17. The stored value is 20.\nWhat does the microprocessor do?', ['Sends a signal to switch the heater on'], ['Sends a signal to switch the heater off', 'Sends a signal to switch the sensor off'], '17 is less than 20, so it is too cold. A signal switches the heater on.',
    ['Is 17 more or less than 20?', 'Too cold means more heat is needed.'], 'A similar question: the reading is 24 and the stored value is 20. What does it do?\nStep 1: 24 is more than 20, so it is too warm.\nStep 2: it sends a signal to switch the heater off.\nNow your question: is 17 more or less than 20?', [/(heat\w*.*\bon\b|\bon\b.*heat|turn\w* on|switch\w* on|start)/i]),
  card('m-03', 'control', 'What is an actuator?', ['A device that the microprocessor switches to make something happen'], ['A device that measures something and sends a reading', 'A device that turns analogue data into digital data'], 'An actuator, such as a motor, pump, valve or heater switch, makes something happen when the microprocessor sends a signal.',
    ['It is not an input device.', 'Think of a motor or a pump.'], null, [/(mov|motor|switch|make|cause|perform|operat|action|act\b|output|turn\w* (on|off)|open|close|happen|physical)/i]),
  card('m-04', 'control', 'A water tank fills by itself. The microprocessor turns on the pump.\nWhat is the pump?', ['An actuator'], ['A sensor', 'An ADC'], 'The pump makes something happen when the microprocessor sends a signal: an actuator.',
    ['Does the pump measure, or does it do something?', 'It is switched on by the microprocessor.'], null, whole('actuator')),
  card('m-05', 'control', 'The heater is now on.\nWhat does the greenhouse system do next?', ['Takes a new reading and checks again'], ['Stops and waits for a person', 'Switches the sensor off for good'], 'The process repeats continuously: read, convert, compare, act, and again.',
    ['Is the job ever finished?', 'When will the heater be switched off?'], null, [/(repeat|again|continu|loop|new reading|keep|carr(y|ies) on|another)/i]),
  card('m-06', 'control', 'Put the steps in order: compare, act, read, convert.\nType the four steps in order.', ['Read, convert, compare, act'], ['Compare, read, convert, act', 'Read, act, convert, compare'], 'Read the sensor, convert with the ADC, compare with the stored value, then act. Then it repeats.',
    ['What has to happen before anything can be compared?', 'The reading must be converted before the microprocessor can use it.'], 'A similar question: put in order: cook, eat, buy.\nStep 1: you cannot cook food you have not got, so buy first.\nStep 2: cook comes before eat.\nNow your question: what must happen to a reading before it can be compared?', [/^\W*read\w*\W+(then\W+)?convert\w*\W+(then\W+)?compar\w*\W+(and\W+|then\W+)?act\w*\W*$/i]),
  card('m-07', 'control', 'Why does the microprocessor store a value, such as 20 degrees?', ['So it has something to compare each reading with'], ['So the sensor knows what to measure next', 'So the ADC knows how to convert data'], 'The stored value is what each reading is compared with, to decide what to do.',
    ['How does it know if 17 is too cold?', 'It needs something to check the reading against.'], null, [/(compar|check|test|against|decide|know if|too (hot|cold|high|low))/i]),
];
const drill = { title: 'Year 10 Homework: Sensors, Analogue and Digital', subtitle: 'Cambridge IGCSE Computer Science 0478',
  categories: [['sensor', 'What a sensor is, and which sensor'], ['ad', 'Analogue and digital'], ['convert', 'ADC and DAC'], ['control', 'The microprocessor using sensor data']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 1 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
  if (c.example) c.answers.forEach((a) => assert(!c.example.toLowerCase().includes(a.toLowerCase()), `card ${c.id}: example holds its answer`));
  assert(drill.categories.some(([k]) => k === c.category), `card ${c.id} category`);
  // Every answer passes its own keywords; no distractor does.
  if (c.keywords) {
    const pass = (s) => c.keywords.some((k) => k.test(s));
    c.answers.forEach((a) => assert(pass(a), `card ${c.id} rejects its answer "${a}"`));
    c.distractors.forEach((d) => assert(!pass(d), `card ${c.id} accepts distractor "${d}"`));
  }
});
assert(new Set(cards.map((c) => c.id)).size === cards.length, 'card ids unique');
assert(cards.length >= 30 && cards.length <= 40, 'drill size ' + cards.length);
const K = (id) => cards.find((c) => c.id === id).keywords;
const yes = (id, list) => list.forEach((s) => assert(K(id).some((k) => k.test(s)), `${id} rejects "${s}"`));
const no = (id, list) => list.forEach((s) => assert(!K(id).some((k) => k.test(s)), `${id} accepts "${s}"`));
yes('c-03', ['ADC', 'adc', 'an ADC', 'analogue to digital converter', 'analog to digital converter', 'Analogue to digital', 'analogue-digital converter', 'Analogue to digital converter (ADC)']);
no('c-03', ['DAC', 'digital to analogue converter', 'converter']);
yes('c-04', ['DAC', 'a DAC', 'digital to analog converter', 'Digital to analogue']);
no('c-04', ['ADC', 'analogue to digital converter']);
yes('a-01', ['analogue', 'Analog', 'analogue data']); no('a-01', ['digital', 'not analogue']);
yes('s-04', ['temperature', 'Temperature sensor', 'a temperature sensor']); no('s-04', ['light']);
yes('s-07', ['infra-red', 'infrared sensor', 'IR', 'infra red']);
yes('s-12', ['pH', 'ph sensor', 'PH']);
yes('m-06', ['read, convert, compare, act', 'Read convert compare act', 'read, convert, compare and act', 'reading, converting, comparing, acting']);
no('m-06', ['compare, read, convert, act', 'read, compare, convert, act']);

// James 2026-11-05: 36 cards (108 perfect attempts) was far too many for homework. Keep 10: 3 in a row each is
// 30 attempts for a perfect student. The other cards stay above (and keep their self-checks) for later use.
const KEEP = ['s-01', 's-11', 's-13', 's-14', 'a-01', 'a-07', 'c-03', 'c-04', 'm-02', 'm-06'];
drill.cards = drill.cards.filter((c) => KEEP.includes(c.id));
assert(drill.cards.length === KEEP.length, 'drill should have ' + KEEP.length + ' cards');
const drillJson = JSON.stringify(drill, (k, v) => v instanceof RegExp ? '__RE__' + v.toString() + '__RE__' : v, 1)
  .replace(/"__RE__(.*?)__RE__"/g, (m, r) => JSON.parse('"' + r + '"'));
const drillSrc = `// Year 10 homework: Sensors, Analogue and Digital. The test drill.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_hw_sensors.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${drillJson});\n`;

// ---------------------------------------------------------------- self-checks
const seen = (s) => JSON.stringify(Object.assign({}, s, { items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined })) }));
const all = JSON.stringify(steps) + drillSrc;
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/\bdecimal\b|mario/i.test(all), 'term outside this lesson');
const firstTaught = { sensor: 'what-sensor', analog: 'analogue', digital: 'digital', microprocessor: 'why-digital', ADC: 'adc', 'analogue to digital': 'adc', DAC: 'dac', actuator: 'control-2' };
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(1, idx).forEach((s) => assert(!new RegExp('\\b' + term, term === term.toUpperCase() ? '' : 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((it) => {
  assert(it.correct >= 0 && it.correct < it.options.length && it.explain, s.id + ' item shape');
  assert(!it.prompt.toLowerCase().includes(it.options[it.correct].toLowerCase()), s.id + ': prompt holds its answer: ' + it.prompt);
}));
NOTES.forEach((n) => assert(n.q && n.model, 'note shape'));
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

const lesson = { id: ID, label: 'Homework: Sensors, Analogue and Digital', steps, validators: {}, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y10-3-1-l4 in the 3.1 unit
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const years = data.years || data;
    const y10 = years.find((y) => y.id === 'year10');
    assert(y10, 'year10 in lessons.json');
    const unit = y10.units.find((u) => (u.lessons || []).includes(PREV));
    assert(unit, 'unit holding ' + PREV);
    unit.lessons.splice(unit.lessons.indexOf(PREV) + 1, 0, ID);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${cards.length} drill cards`);
