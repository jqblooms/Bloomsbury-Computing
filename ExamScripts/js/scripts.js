// Exam Scripts: the scripts. Each one is a short Paper 1 answer with its mark points, taken from real Cambridge
// 0478 mark schemes (Desktop\0478 Past Papers\extract\papers), in their words, simplified only where needed. The
// class mock (0478/11 June 2026: robot animal, quad-core smartphone, USB mouse) is never used.
//
// Shape of a script:
//   id, topic ('robots' or 'cpu'), title, marks
//   rotate: true    every level draws a variant (the least recently seen); otherwise variant 0 is used for
//                   levels 1 to 5 and level 6 draws one of the others (a new scenario or wording)
//   variants: [{ q: question, model: [sentences], points?: [...] }]
//     A model sentence is "starter| rest" with [key words] in square brackets: level 2 blanks the key words,
//     level 3 shows the starter and the first letter of every other word, level 4 shows only the starters.
//   points: [{ id, need, g: [[stems], [stems]], ord?, not? }] (a variant's own points replace the script's)
//     need is the mark point as the mark scheme words it. g is a list of groups: one sentence of the answer
//     must hold a stem from every group (ord: in that order) and none of the `not` phrases.
//     A stem matches a word that starts with it (stems under 4 letters must match the whole word), with a
//     spelling slip allowed in stems of 6 letters or more. '#num' matches any number.
//   strip: phrases removed before marking (a component's own name, so "arithmetic logic unit" cannot earn the
//          "arithmetic" point by itself)
//   rivals: (one-word answers) any of these that is not an accepted answer makes the answer wrong
var ES_SCRIPTS = (function () {
  'use strict';

  // ---------------------------------------------------------------- Robots, sensors and AI

  // Sources: 0478/11 November 2025 Q5(a) (Describe the characteristics of a robot [3]: a mechanical structure /
  // framework; electrical components ... such as sensors / microprocessor / actuators; programmable; has the ability
  // to move). 0478/11 June 2024 Q8(b) (Give three characteristics [3], same points). 0478/11 June 2023 Q9(a)
  // (furniture factory; mechanical structure / framework, electrical components).
  var robot = {
    id: 'robot-chars', topic: 'robots', title: 'Characteristics of a robot', marks: 3,
    points: [
      { id: 'mech', need: 'It has a mechanical structure or framework.', g: [['mechanical', 'framework', 'frame', 'structure']] },
      { id: 'elec', need: 'It has electrical components, such as sensors, microprocessors and actuators.', g: [['electric', 'electronic', 'sensor', 'microprocessor', 'actuator']] },
      { id: 'prog', need: 'It is programmable.', g: [['program', 'programmable', 'programmed', 'coded']] },
      { id: 'move', need: 'It can move.', g: [['move', 'moving', 'movement']] }
    ],
    variants: [
      { q: 'Describe the characteristics of a robot.', model: [
        'It has a| [mechanical structure] or [framework].',
        'It has| [electrical components], such as [sensors], [microprocessors] and [actuators].',
        'It is| [programmable].'] },
      { q: 'A farmer uses a robot to plant seeds in a field. Give three characteristics of a robot.', model: [
        'It has a| [mechanical structure].', 'It has| [electrical components], such as [sensors].', 'It is| [programmable].'] },
      { q: 'A supermarket uses robots to deliver groceries to its customers. Describe the characteristics of a robot.', model: [
        'It has a| [framework].', 'It has| [electrical components], such as [actuators].', 'It is| [programmable].'] },
      { q: 'A factory uses robots to make large pieces of furniture. Give three characteristics of a robot.', model: [
        'It has a| [mechanical structure].', 'It has| [electrical components], such as a [microprocessor].', 'It can be| [programmed].'] }
    ]
  };

  // Sources: 0478/13 November 2024 Q5(a) (State what is meant by an automated system [1]: (a system) that can perform
  // actions without human intervention). 0478/11 June 2024 Q8(a) (the robot being automated: the robot can perform
  // actions without human intervention).
  var automated = {
    id: 'automated', topic: 'robots', title: 'What automated means', marks: 1,
    points: [
      { id: 'human', need: 'It can perform actions without human intervention.', g: [['without', 'no', 'not need', 'doesnt need', 'does not need', 'not needing'], ['human', 'person', 'people', 'user', 'someone', 'anyone', 'operator']] }
    ],
    variants: [
      { q: 'State what is meant by an automated system.', model: ['It is a system that| can perform [actions] [without] [human intervention].'] },
      { q: 'A farmer uses an automated robot to plant seeds. State what is meant by the robot being automated.', model: ['The robot| can perform [actions] [without] [human intervention].'] },
      { q: 'A farmer uses an automated plough to dig a field. State what is meant by an automated system.', model: ['It| can perform [actions] [without] [human intervention].'] }
    ]
  };

  // Which sensor. Each scenario is a real question part; its accepted answers are the mark scheme's.
  var SENSOR_RIVALS = ['light', 'infrared', 'infra red', 'motion', 'humidity', 'moisture', 'ph', 'acidity', 'level', 'proximity',
    'temperature', 'pressure', 'magnetic', 'microphone', 'acoustic', 'flow', 'sound', 'gas', 'accelerometer', 'ultrasonic', 'touch', 'heat', 'weight'];
  function sensor(q, model, stems) {
    return { q: q, model: [model], points: [{ id: 'sensor', need: model.replace(/[\[\]|]/g, ''), g: [stems] }] };
  }
  var sensors = {
    id: 'sensor-choice', topic: 'robots', title: 'Which sensor?', marks: 1, rotate: true, rivals: SENSOR_RIVALS,
    variants: [
      // 0478/12 June 2021 Q5(a): security light, only on when dark and movement: light sensor; motion // infra-red.
      sensor('A security light only comes on when it is dark. Identify the sensor that checks if it is dark.', 'A| [light] sensor.', ['light']),
      sensor('A security light only comes on when movement is detected. Identify the sensor that detects the movement.', 'An| [infra-red] sensor.', ['infrared', 'infra red', 'motion', 'pir']),
      // 0478/12 November 2022 Q2(b): spray paint garage air dry enough: moisture / humidity; headlights when dark:
      // light. (Kept to everyday sensors: James 2026-11-12, the question gives the context; pH, level, magnetic field and flow left out.)
      sensor('A system checks that the air is dry enough in a garage that spray paints cars. Identify the most suitable sensor.', 'A| [humidity] sensor.', ['humidity', 'moisture']),
      sensor('A car automatically switches on its headlights when it is dark. Identify the most suitable sensor.', 'A| [light] sensor.', ['light']),
      // 0478/12 November 2024 Q8(a): robot vacuum cleaner navigating round obstacles: proximity.
      sensor('A robot vacuum cleaner uses a sensor to move around obstacles in a room. Identify the most suitable sensor.', 'A| [proximity] sensor.', ['proximity']),
      // 0478/11 November 2021 Q9(a): washing machine: water is 30 °C: temperature; weight of clothes: pressure.
      sensor('A washing machine checks that the water is 30 °C. Identify a suitable sensor.', 'A| [temperature] sensor.', ['temperature']),
      sensor('A washing machine checks the weight of the clothes, so that it is not overloaded. Identify a suitable sensor.', 'A| [pressure] sensor.', ['pressure']),
      // 0478/13 June 2024 Q6(c) (use given, here the sensor is asked for): counting vehicles that cross a bridge:
      // magnetic field; person approaching automatic doors: infra-red; kettle boiling: temperature; greenhouse air
      // moist enough: humidity.
      sensor('Automatic doors open when a person comes near them. Identify a suitable sensor.', 'An| [infra-red] sensor.', ['infrared', 'infra red', 'motion', 'proximity', 'pir']),
      sensor('A kettle checks whether the water in it is boiling. Identify a suitable sensor.', 'A| [temperature] sensor.', ['temperature']),
      sensor('A system checks whether the air is moist enough in a greenhouse. Identify a suitable sensor.', 'A| [humidity] sensor.', ['humidity', 'moisture']),
      // 0478/12 March 2025 Q4(a)(i): the ATM detects a person: infra-red / proximity.
      sensor('A cash machine (ATM) detects when a person is in front of it. Identify an appropriate sensor.', 'An| [infra-red] sensor.', ['infrared', 'infra red', 'proximity', 'motion', 'pir']),
      // 0478/12 November 2025 Q7(b): the input device for voice commands: microphone.
      sensor('A smart speaker takes voice commands as input. Identify the input device that allows voice commands to be used as input.', 'A| [microphone].', ['microphone', 'mic', 'acoustic', 'sound']),
      // 0478/11 June 2021 Q5: greenhouse kept between 25 °C and 30 °C with a temperature sensor.
      sensor('A greenhouse must stay between 25 °C and 30 °C. Identify the sensor the system uses.', 'A| [temperature] sensor.', ['temperature']),
      // 0478/13 November 2021 Q2(d)(i): counting people entering a stadium: pressure sensor; motion sensor.
      sensor('Sensors at the entrance of a stadium count the number of people going in. Identify a sensor that could be used.', 'A| [pressure] sensor.', ['pressure', 'motion', 'infrared', 'infra red'])
    ]
  };

  // How a sensor and a microprocessor control something. The points are the generic script that every one of these
  // mark schemes uses:
  //   0478/11 June 2024 Q8(c) (robot stops at a fence [6]): proximity sensor; sensor continuously sends digitised data
  //     to the microprocessor; microprocessor compares the data to a stored value / range; if outside the range a
  //     signal is sent to turn / stop the robot; using an actuator; process repeats until turned off.
  //   0478/11 June 2021 Q5 (greenhouse [8]): sensor sends data to microprocessor; converted from analogue to digital
  //     (ADC); compares to stored values; if greater than 30 sends signal to open window and turn heater off ...
  //   0478/12 June 2021 Q5(b) (security light [8]), 0478/12 March 2023 Q6(c) (robot turns at 10 cm [7]),
  //   0478/12 March 2024 Q6(b)(i) (tractor stops for a person within 3 m [5]), 0478/12 November 2022 Q2(a)
  //   (automatic tap [6]), 0478/11 November 2021 Q9(b) (washing machine at 30 °C [6]).
  var control = {
    id: 'sensor-control', topic: 'robots', title: 'Sensor control', marks: 6,
    points: [
      { id: 'send', need: 'The sensor sends data to the microprocessor.', g: [['sensor', 'sensors'], ['microprocessor', 'processor', 'micro processor', 'mp']] },
      { id: 'adc', need: 'The data is converted from analogue to digital (using an ADC).', g: [['digital', 'digitis', 'digitiz', 'adc', 'analog']] },
      { id: 'compare', need: 'The microprocessor compares the data with a stored value.', g: [['compar', 'check'], ['stored', 'store', 'preset', 'pre set', 'set', 'range', 'saved', '#num']] },
      { id: 'signal', need: 'If the data is above, below or matches the stored value, the microprocessor sends a signal (to do the action).', g: [['if', 'when', 'above', 'below', 'greater', 'less', 'more than', 'higher', 'lower', 'outside', 'match', 'too'], ['signal']] },
      { id: 'actuator', need: 'An actuator is used to do the action.', g: [['actuator']] },
      { id: 'repeat', need: 'The process repeats continuously (until it is turned off).', g: [['repeat', 'loop', 'again', 'until', 'continuous', 'continuously', 'continually', 'constantly', 'all the time']], not: ['send', 'sends', 'sent'] }
    ],
    variants: [
      { q: 'A farmer uses a robot to plant seeds. The robot stops when it reaches a fence, then it turns. Explain how the robot uses a sensor and a microprocessor to know it has reached a fence.', model: [
        'A proximity sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with a [stored value].',
        'If the data shows the fence,| the microprocessor sends a [signal] to stop and turn the robot.',
        'An| [actuator] is used to [stop] and [turn] the robot.',
        'This process| [repeats] [continuously].'] },
      { q: 'A greenhouse must stay between 25 °C and 30 °C. A system with a temperature sensor and a microprocessor opens a window and turns a heater off if it is too hot. Describe how the system keeps the temperature in range.', model: [
        'The temperature sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with the [stored values] of 25 and 30.',
        'If the data is above 30,| the microprocessor sends a [signal] to open the window and turn the heater off.',
        'An| [actuator] is used to [open] the window.',
        'This process| [repeats] [continuously].'] },
      { q: 'A security light comes on when it is dark and movement is detected. Describe how the sensors and the microprocessor control the light.', model: [
        'The light and motion sensors| send [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with [stored values].',
        'If it is dark and there is movement,| the microprocessor sends a [signal] to switch the light on.',
        'An| [actuator] is used to [switch] the light on.',
        'This process| [repeats] [continuously].'] },
      { q: 'A robot moves forward. If an object is 10 cm or closer, the robot turns. Explain how the robot uses a sensor and a microprocessor to do this.', model: [
        'An infra-red sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with the [stored value] of 10 cm.',
        'If the data is 10 cm or less,| the microprocessor sends a [signal] to make the robot turn.',
        'An| [actuator] is used to [turn] the robot.',
        'This process| [repeats] [continuously].'] },
      { q: 'A self-driving tractor must stop if a person is detected within 3 metres. Explain how a sensor and a microprocessor are used to stop the tractor.', model: [
        'The sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with the [stored value] of 3 metres.',
        'If a person is within 3 metres,| the microprocessor sends a [signal] to stop the tractor.',
        'An| [actuator] is used to apply the [brakes].',
        'This process| [repeats] [continuously].'] },
      { q: 'Water flows from a tap when a person puts their hands under it. Explain how the tap system uses a sensor and a microprocessor.', model: [
        'A motion sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with a [stored value].',
        'If hands are detected,| the microprocessor sends a [signal] to turn the tap on.',
        'An| [actuator] is used to [turn] the tap on and off.',
        'This process| [repeats] [continuously].'] },
      { q: 'A washing machine keeps the water at 30 °C. Describe how a sensor and a microprocessor make sure the water stays at 30 °C.', model: [
        'A temperature sensor| sends [data] to the [microprocessor].',
        'The data is| [converted] from [analogue] to [digital].',
        'The microprocessor| [compares] the data with the [stored value] of 30.',
        'If the data is below 30,| the microprocessor sends a [signal] to turn the heater on.',
        'An| [actuator] is used to [turn] the heater on and off.',
        'This process| [repeats] [continuously].'] }
    ]
  };

  // Sources: 0478/13 November 2025 Q6(a) (Describe what is meant by AI [3]: simulation of intelligent behaviours by
  // computers; collection of data and rules for using that data; ability to learn; ability to adapt; ability to
  // reason / make decisions). 0478/12 June 2024 Q10(a) (same points [2]). 0478/12 November 2023 Q10(a) (makes
  // predictions; simulates intelligent / human behaviour).
  var ai = {
    id: 'ai-meaning', topic: 'robots', title: 'What AI means', marks: 3,
    points: [
      { id: 'sim', need: 'It is the simulation of intelligent behaviour by computers.', g: [['simulat', 'imitat', 'mimic', 'copy', 'copies'], ['intelligen', 'human', 'behav']] },
      { id: 'data', need: 'It has a collection of data and rules for using that data.', g: [['data', 'knowledge', 'facts'], ['rule']] },
      { id: 'reason', need: 'It has the ability to reason (make decisions).', g: [['reason', 'decision', 'decide', 'problem solv', 'predict']] },
      { id: 'learn', need: 'It has the ability to learn and adapt.', g: [['learn', 'adapt']] }
    ],
    variants: [
      { q: 'Describe what is meant by artificial intelligence (AI).', model: [
        'AI is| the [simulation] of [intelligent behaviour] by computers.',
        'It has a| [collection of data] and [rules] for using that data.',
        'It has the| ability to [reason] and to [learn].'] },
      { q: 'A computer game uses AI to control the movements of its characters. Describe what is meant by AI.', model: [
        'AI is| the [simulation] of [intelligent behaviour] by computers.',
        'It has the| ability to [reason].', 'It has the| ability to [learn] and [adapt].'] },
      { q: 'A garage uses an expert system, which is an example of AI. Describe what is meant by AI.', model: [
        'It has a| [collection of data] and [rules] for using that data.',
        'It has the| ability to [reason].', 'It has the| ability to [learn].'] }
    ]
  };

  // Sources: 0478/13 June 2026 Q6(b) (State what is meant by machine learning [1]: a program that has the ability to
  // automatically adapt its own data and processes). 0478/11 June 2025 Q8(e) (the ability to automatically adapt
  // its own processes is machine learning). 0478/13 November 2023 Q10(b) (can adapt / change its own processes, edit
  // its own data).
  var mlMeaning = {
    id: 'ml-meaning', topic: 'robots', title: 'What machine learning is', marks: 1,
    points: [
      { id: 'adapt', need: 'A program that can automatically adapt its own data and processes.', g: [['adapt', 'change', 'edit', 'alter', 'update'], ['own'], ['data', 'process', 'rule', 'algorithm']] }
    ],
    variants: [
      { q: 'State what is meant by machine learning.', model: ['It is a program that| can automatically [adapt] its [own] [data] and [processes].'] },
      { q: 'A computer game uses machine learning. State what is meant by machine learning.', model: ['It is a program that| can automatically [adapt] its [own] [data] and [processes].'] },
      { q: 'An expert system has machine learning. State what this means.', model: ['The system| can automatically [change] its [own] [data] and [processes].'] }
    ]
  };

  // How machine learning improves a system. Points from:
  //   0478/13 November 2024 Q5(d) (plough [4]): gather data; use this data to adapt its own process; so that it will
  //     make fewer mistakes; the most efficient route.
  //   0478/12 November 2024 Q8(c) (robot vacuum cleaner [3]): gather data during vacuuming; adapt its own processes;
  //     where obstacles are, where dirtier areas are, the most efficient route.
  //   0478/12 November 2025 Q7(c) (smart speaker [4]): gather data; analyse / identify patterns; adapt its own
  //     processes; stores successful / unsuccessful voice commands.
  //   0478/13 June 2025 Q6(f)(ii) (weather station [3]): adapt its own processes / data; analyse the data for trends /
  //     patterns. 0478/13 November 2025 Q6(b) (game characters [3]): collect data, identify patterns, adapt, store
  //     successful moves. 0478/12 June 2026 Q6(b) (flower app [4]). 0478/11 November 2025 Q5(e) (delivery robot [3]).
  //   0478/11 June 2024 Q8(f): the robot will become more efficient; it may make fewer errors.
  var mlImprove = {
    id: 'ml-improve', topic: 'robots', title: 'How machine learning helps', marks: 4,
    points: [
      { id: 'collect', need: 'It collects (gathers) data.', g: [['collect', 'gather', 'record'], ['data', 'information', 'info', 'feedback', 'readings']] },
      { id: 'store', need: 'It stores the data (successful and unsuccessful results).', g: [['store', 'stores', 'save', 'remember', 'keeps']] },
      { id: 'pattern', need: 'It analyses the data to find patterns.', g: [['pattern', 'trend', 'analys', 'analyz']] },
      { id: 'adapt', need: 'It adapts (changes) its own processes or rules.', g: [['adapt', 'change', 'edit', 'alter', 'update'], ['own', 'rule', 'process', 'behav', 'algorithm']] },
      { id: 'better', need: 'So it makes fewer mistakes (it is more efficient or more accurate).', g: [['fewer', 'less', 'efficien', 'accura', 'faster', 'quicker', 'optimal']] }
    ],
    variants: [
      { q: 'A robot vacuum cleaner has machine learning. Explain how machine learning can improve the robot vacuum cleaner.', model: [
        'It| [collects] [data] while it vacuums, such as where obstacles are.',
        'It| [stores] this data.',
        'It| [analyses] the data to find [patterns].',
        'It| [adapts] its [own processes], such as the route it takes, so it makes [fewer mistakes].'] },
      { q: 'A farmer has an automated plough. Explain how the plough can use machine learning to dig the field better.', model: [
        'It| [collects] [data] about the field, such as where the obstacles are.',
        'It| [stores] this data.',
        'It| [analyses] the data to find [patterns].',
        'It| [adapts] its [own processes], so it takes the most [efficient] route.'] },
      { q: 'A smart speaker has machine learning. Explain how it can use machine learning to understand voice commands better.', model: [
        'It| [collects] [data] from different voices.',
        'It| [stores] successful and unsuccessful commands.',
        'It| [analyses] the data to find [patterns] in a user\'s voice.',
        'It| [adapts] its [own processes], so it makes [fewer mistakes].'] },
      { q: 'A weather station uses machine learning to predict the weather. Explain how machine learning can improve its predictions.', model: [
        'It| [collects] weather [data].',
        'It| [stores] the data and the results of its predictions.',
        'It| [analyses] the data to find [patterns].',
        'It| [adapts] its [own rules], so its predictions are more [accurate].'] },
      { q: 'A computer game uses machine learning to control its characters. Explain how machine learning can improve the movements of the characters.', model: [
        'It| [collects] [data] about the player\'s actions.',
        'It| [stores] successful and unsuccessful moves.',
        'It| [analyses] the data to find [patterns] in how the player moves.',
        'It| [adapts] its [own processes], so its moves are more [efficient].'] },
      { q: 'An app names a flower from a photograph. Explain how the app can use machine learning to name flowers more accurately.', model: [
        'It| [collects] [data] from photographs of flowers.',
        'It| [stores] successful and unsuccessful identifications.',
        'It| [analyses] the photographs to find [patterns].',
        'It| [adapts] its [own rules], so it makes [fewer mistakes].'] },
      { q: 'A supermarket uses robots to deliver groceries. Explain how a robot can use machine learning to improve its deliveries.', model: [
        'It| [collects] [data] about the route to each house.',
        'It| [remembers] where the obstacles are.',
        'It| [analyses] the route data to find [patterns].',
        'It| [adapts] its [own processes], so it takes the most [efficient] route.'] }
    ]
  };

  // ---------------------------------------------------------------- The CPU and the FDE cycle

  // One register a time. Sources: 0478/12 November 2024 Q6 (PC: stores the address of the next instruction to be
  // fetched; accumulator: stores the interim result for a calculation). 0478/12 March 2021 Q8(b)(i) (PC: holds the
  // address of next / current instruction). 0478/11 November 2021 Q6(a) and 0478/13 November 2021 Q5 (MAR: holds the
  // address of the data / instruction that is about to be fetched from memory; MDR: holds data or an instruction that
  // has been fetched from memory). 0478/12 November 2023 Q3(c) (MAR stores addresses of the next instruction / data
  // to be fetched). 0478/11 November 2023 Q1(e)(i) (MDR stores data that has been fetched / to be written to memory).
  // 0478/11 June 2025 Q5(a) (CIR stores the instruction that is being decoded / executed; accumulator stores the
  // result of interim calculations).
  var ADDRESS_WORDS = ['holds the address', 'stores the address', 'store the address', 'hold the address', 'holds an address', 'stores an address', 'address of'];
  var registers = {
    id: 'registers', topic: 'cpu', title: 'The registers', marks: 1, rotate: true,
    variants: [
      { q: 'State the role of the program counter (PC) in the fetch-decode-execute (FDE) cycle.', model: ['It| stores the [address] of the [next instruction] to be fetched.'],
        points: [{ id: 'pc', need: 'It stores the address of the next instruction (to be fetched).', g: [['address', 'location'], ['next', 'current']] }] },
      { q: 'State the role of the memory address register (MAR) in the FDE cycle.', model: ['It| stores the [address] of the data or instruction that is about to be [fetched] from memory.'],
        points: [{ id: 'mar', need: 'It stores the address of the data or instruction that is about to be fetched from memory.', g: [['address', 'location'], ['fetch', 'memory', 'ram', 'data', 'instruction', 'written']] }] },
      { q: 'State the role of the memory data register (MDR) in the FDE cycle.', model: ['It| stores the [data] or [instruction] that has been [fetched] from memory.'],
        points: [{ id: 'mdr', need: 'It stores the data or instruction that has been fetched from memory.', g: [['data', 'instruction'], ['fetch', 'memory', 'ram', 'read', 'written', 'write']], not: ADDRESS_WORDS }] },
      { q: 'State the role of the current instruction register (CIR) in the FDE cycle.', model: ['It| stores the [instruction] that is being [decoded] and [executed].'],
        points: [{ id: 'cir', need: 'It stores the instruction that is being decoded or executed.', g: [['instruction'], ['decod', 'execut', 'current', 'being']], not: ADDRESS_WORDS }] },
      { q: 'State the role of the accumulator (ACC) in the CPU.', model: ['It| stores the [result] of [interim calculations].'],
        points: [{ id: 'acc', need: 'It stores the result of interim calculations.', g: [['result', 'answer', 'interim', 'value', 'data'], ['calculat', 'arithmetic', 'sum', 'operation', 'alu']], not: ADDRESS_WORDS }] }
    ]
  };

  // The fetch stage. Sources: 0478/11 June 2024 Q5(d) (fetch stage diagram, any four: address sent from PC to MAR;
  // using address bus; PC is incremented; address sent from MAR to RAM; data / instruction sent from RAM to MDR;
  // using data bus; data / instruction sent from MDR to CIR / CU). 0478/11 November 2025 Q6(a) (the PC stores the
  // address of the next instruction, the address is sent to the MAR, the instruction is retrieved from RAM and
  // stored in the MDR, then sent to the CIR). 0478/12 June 2026 Q2(c) (address copied to the MAR, data copied to the
  // MDR).
  var fetch = {
    id: 'fetch', topic: 'cpu', title: 'The fetch stage', marks: 4,
    points: [
      { id: 'pc-mar', need: 'The address is sent from the PC to the MAR.', g: [['pc', 'program counter'], ['mar', 'memory address register']], ord: true },
      { id: 'abus', need: 'It uses the address bus.', g: [['address bus']] },
      { id: 'inc', need: 'The PC is incremented.', g: [['increment', 'increas', 'add 1', 'adds 1', 'add one', 'adds one', 'plus 1', 'plus one', 'up by 1', 'up by one', 'goes up']] },
      { id: 'mar-ram', need: 'The address is sent from the MAR to RAM.', g: [['mar', 'memory address register'], ['ram', 'main memory', 'primary memory']], ord: true },
      { id: 'ram-mdr', need: 'The instruction is sent from RAM to the MDR.', g: [['ram', 'main memory', 'primary memory'], ['mdr', 'memory data register']] },
      { id: 'dbus', need: 'It uses the data bus.', g: [['data bus']] },
      { id: 'mdr-cir', need: 'The instruction is sent from the MDR to the CIR.', g: [['mdr', 'memory data register'], ['cir', 'current instruction register', 'instruction register']], ord: true }
    ],
    variants: [
      { q: 'Describe the fetch stage of the fetch-decode-execute (FDE) cycle.', model: [
        'The address in the PC| is sent to the [MAR] using the [address bus].',
        'The PC| is [incremented].',
        'The instruction| is sent from [RAM] to the [MDR] using the [data bus].',
        'The instruction| is then sent from the MDR to the [CIR].'] },
      { q: 'An instruction is fetched from random access memory (RAM) into the CPU. Explain how the registers are used to fetch it.', model: [
        'The address in the PC| is sent to the [MAR].',
        'The PC| is [incremented].',
        'The instruction| is sent from [RAM] to the [MDR].',
        'The instruction| is then sent from the MDR to the [CIR].'] },
      { q: 'A computer processes instructions using the FDE cycle. Describe what happens in the fetch stage.', model: [
        'The address in the PC| is sent to the [MAR] using the [address bus].',
        'The PC| is [incremented].',
        'The address| is sent from the MAR to [RAM].',
        'The instruction| is sent from RAM to the [MDR] using the [data bus].'] }
    ]
  };

  // The decode stage. Sources: 0478/11 November 2024 Q5(b) (any three: CIR / CU receives the instruction from the
  // MDR; using the data bus; instruction is separated into opcode and operand; control unit decodes the instruction;
  // using an instruction set). 0478/13 November 2024 Q3(b) (the same points, as a diagram).
  var decode = {
    id: 'decode', topic: 'cpu', title: 'The decode stage', marks: 3,
    points: [
      { id: 'mdr-cir', need: 'The instruction is sent from the MDR to the CIR.', g: [['mdr', 'memory data register'], ['cir', 'current instruction register', 'instruction register', 'control unit', 'cu']] },
      { id: 'cu', need: 'The control unit decodes the instruction.', g: [['control unit', 'cu'], ['decod']] },
      { id: 'set', need: 'It uses an instruction set.', g: [['instruction set']] },
      { id: 'opcode', need: 'The instruction is split into opcode and operand.', g: [['opcode', 'op code', 'operand']] },
      { id: 'dbus', need: 'It uses the data bus.', g: [['data bus']] }
    ],
    variants: [
      { q: 'Describe the decode stage of the fetch-decode-execute (FDE) cycle.', model: [
        'The instruction| is sent from the [MDR] to the [CIR].',
        'The control unit| [decodes] the instruction using an [instruction set].'] },
      { q: 'An instruction has been fetched into the memory data register (MDR). Describe how the instruction is decoded.', model: [
        'The instruction| is sent to the [CIR] using the [data bus].',
        'The control unit| [decodes] the instruction using an [instruction set].'] },
      { q: 'The CPU uses the FDE cycle. Describe what happens after an instruction is fetched, until it is ready to execute.', model: [
        'The instruction| is sent from the [MDR] to the [CIR].',
        'The instruction| is split into [opcode] and [operand].',
        'The control unit| [decodes] the instruction.'] }
    ]
  };

  // The execute stage. Source: 0478/12 November 2025 Q4(a) (decode and execute diagram: CU decodes the instruction and
  // sends a signal to the ALU to execute it; ALU executes the instruction / performs the mathematical or logical
  // operation; ACC is built into the ALU; ACC stores any data needed; CU sends a signal to RAM to fetch any data
  // needed for the instruction). 0478/13 June 2024 Q8(c) (the ALU stores interim results in the accumulator).
  var execute = {
    id: 'execute', topic: 'cpu', title: 'The execute stage', marks: 3,
    strip: ['arithmetic logic unit', 'arithmetic and logic unit'],
    points: [
      { id: 'signal', need: 'The control unit sends a signal to the ALU (to execute the instruction).', g: [['control unit', 'cu'], ['signal']] },
      { id: 'alu', need: 'The ALU executes the instruction (it does the calculation or logical operation).', g: [['alu', 'arithmetic logic unit'], ['execut', 'calculat', 'operation', 'maths', 'math', 'perform', 'carries out', 'carry out']] },
      { id: 'acc', need: 'The accumulator stores the data or the result.', g: [['acc', 'accumulator'], ['store', 'stores', 'hold', 'holds', 'keep', 'result', 'data']] },
      { id: 'fetch', need: 'The control unit sends a signal to RAM to fetch any data the instruction needs.', g: [['data'], ['ram', 'memory'], ['fetch', 'get']] }
    ],
    variants: [
      { q: 'Describe the execute stage of the fetch-decode-execute (FDE) cycle.', model: [
        'The control unit| sends a [signal] to the [ALU].',
        'The ALU| [executes] the instruction, such as a [calculation].',
        'The| [accumulator] [stores] the [result].'] },
      { q: 'An instruction has been decoded. Describe how the CPU executes the instruction.', model: [
        'The control unit| sends a [signal] to the [ALU].',
        'The ALU| [performs] the [calculation] or logical operation.',
        'The| [accumulator] [stores] the [result].'] },
      { q: 'The CPU contains a control unit (CU), an arithmetic logic unit (ALU) and an accumulator (ACC). Describe how they are used in the execute stage.', model: [
        'The CU| sends a [signal] to the ALU.',
        'The ALU| [executes] the instruction.',
        'The| [accumulator] [stores] the [result].'] }
    ]
  };

  // Sources: 0478/13 June 2024 Q8(c) (role of the ALU, any three: to execute instructions; to perform calculations;
  // to perform logical operations; to store interim results of calculations; reads / writes data to the
  // accumulator). 0478/12 June 2025 Q4(a) (it carries out all the arithmetic and logic operations).
  var alu = {
    id: 'alu', topic: 'cpu', title: 'The ALU', marks: 2,
    strip: ['arithmetic logic unit', 'arithmetic and logic unit'],
    points: [
      { id: 'calc', need: 'It performs calculations (arithmetic operations).', g: [['calculat', 'arithmetic', 'add', 'subtract', 'maths', 'math']] },
      { id: 'logic', need: 'It performs logical operations.', g: [['logic', 'logical', 'compar', 'boolean']] },
      { id: 'interim', need: 'It stores interim results of calculations (in the accumulator).', g: [['interim', 'accumulator', 'acc']] },
      { id: 'exec', need: 'It executes instructions.', g: [['execut']] }
    ],
    variants: [
      { q: 'State the purpose of the arithmetic logic unit (ALU).', model: ['It| performs [calculations].', 'It| performs [logical operations].'] },
      { q: 'One component in the CPU is the arithmetic logic unit (ALU). Describe the role of the ALU.', model: ['It| performs [calculations].', 'It| performs [logical operations].'] },
      { q: 'The CPU has an ALU. Describe what the ALU does.', model: ['It| carries out [arithmetic] operations.', 'It| carries out [logical operations].'] }
    ]
  };

  // Sources: 0478/13 November 2025 Q2(b)(ii) (role of the CU: it sends control signals to other components; using
  // the control bus; to manage the flow of data through the CPU; it decodes an instruction; using an instruction
  // set). 0478/12 June 2025 Q4(a) (it sends signals to all the components in the CPU to manage the flow of data
  // through the CPU). 0478/13 November 2021 Q5 (sends control signals to control the flow of data through the CPU //
  // manages the execution of instructions).
  var cu = {
    id: 'cu', topic: 'cpu', title: 'The control unit', marks: 2,
    strip: ['control unit'],
    points: [
      { id: 'signals', need: 'It sends control signals to the other components.', g: [['signal']] },
      { id: 'flow', need: 'It manages the flow of data through the CPU.', g: [['flow', 'manage', 'coordinat'], ['data', 'instruction']] },
      { id: 'decode', need: 'It decodes the instructions (using an instruction set).', g: [['decod']] },
      { id: 'bus', need: 'It uses the control bus.', g: [['control bus']] }
    ],
    variants: [
      { q: 'State the purpose of the control unit (CU).', model: ['It| sends [control signals] to the other components.', 'It| [manages] the [flow of data] through the CPU.'] },
      { q: 'The CPU has a control unit (CU). Describe the role of the control unit.', model: ['It| sends [control signals] to the other components.', 'It| [decodes] the instructions.'] },
      { q: 'A component in the CPU sends signals to manage the FDE cycle. Describe the role of this component, the control unit.', model: ['It| [manages] the [flow of data] through the CPU.', 'It| [decodes] the instructions using an [instruction set].'] }
    ]
  };

  // Sources: 0478/13 June 2024 Q8(d) (any four: more cores ... increasing the number of FDE cycles / instructions it
  // can perform at the same time; higher clock speed ... increasing the number of FDE cycles / instructions per
  // second; greater cache size ... meaning more frequently used data can be accessed faster). 0478/12 November 2025
  // Q4(c) (the same three pairs; MAX 2 if no expansion given). 0478/12 March 2024 Q2(b)(ii) and (iii) (each core
  // runs an FE cycle simultaneously; more cache: frequently used data / instructions accessed faster instead of
  // from the slower-access RAM).
  var perf = {
    id: 'performance', topic: 'cpu', title: 'Cores, clock speed and cache', marks: 6,
    points: [
      { id: 'cores', need: 'It could have more cores.', g: [['core']] },
      { id: 'cores-why', need: 'More instructions can be processed at the same time (simultaneously).', g: [['simultan', 'same time', 'at once', 'parallel']] },
      { id: 'clock', need: 'It could have a higher clock speed.', g: [['clock']] },
      { id: 'clock-why', need: 'More FDE cycles (instructions) can be processed per second.', g: [['second', 'seconds']] },
      { id: 'cache', need: 'It could have a larger cache.', g: [['cache']] },
      { id: 'cache-why', need: 'More frequently used data can be stored in cache and accessed faster than from RAM.', g: [['frequent', 'often', 'than ram', 'than from ram', 'instead of ram', 'slower ram']] }
    ],
    variants: [
      { q: 'A computer is running slowly. Explain three changes to the CPU that would improve its performance.', model: [
        'It could have| more [cores], so more instructions are processed at the [same time].',
        'It could have| a higher [clock speed], so more FDE cycles are done [per second].',
        'It could have| a larger [cache], so more [frequently used] data is accessed faster.'] },
      { q: 'A student wants a faster computer. Explain how the number of cores, the clock speed and the cache size affect the performance of the CPU.', model: [
        'More| [cores] means more instructions are processed at the [same time].',
        'A higher| [clock speed] means more FDE cycles are done [per second].',
        'A larger| [cache] means more [frequently used] data is accessed faster than from RAM.'] },
      { q: 'A company replaces its CPUs with new ones. Explain how the new CPU could be designed to have better performance.', model: [
        'It could have| more [cores], so more instructions are processed [simultaneously].',
        'It could have| a higher [clock speed], so more instructions are processed [per second].',
        'It could have| more [cache], so [frequently used] instructions are accessed faster.'] }
    ]
  };

  return [robot, automated, sensors, control, ai, mlMeaning, mlImprove, registers, fetch, decode, execute, alu, cu, perf];
})();
if (typeof module !== 'undefined') module.exports = ES_SCRIPTS;
