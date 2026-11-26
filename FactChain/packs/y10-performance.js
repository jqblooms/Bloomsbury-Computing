window.FACT_CHAIN_PACKS = window.FACT_CHAIN_PACKS || {};
window.FACT_CHAIN_PACKS['y10-performance'] = {
  id: 'y10-performance',
  title: 'CPU Performance',
  year: 'Year 10',
  part: 'clock',
  intro: 'The clock, cores and cache: what each one is, and why more of each can make a CPU faster.',
  chain: [
    { text: 'On each clock pulse, the CPU performs one FDE cycle.',
      gaps: ['FDE cycle', 'clock pulse'],
      accept: {
        'FDE cycle': ['fetch decode execute cycle', 'fetch-decode-execute cycle', 'fde', 'cycle', 'instruction', 'fe cycle'],
        'clock pulse': ['clock tick', 'pulse', 'tick', 'clock cycle']
      },
      hl: ['clock'] },
    { text: 'The clock controls the number of FDE cycles performed per second.',
      gaps: ['clock', 'number of FDE cycles', 'per second'],
      accept: {
        'clock': ['system clock', 'cpu clock'],
        'number of FDE cycles': ['number of cycles', 'number of fetch decode execute cycles', 'number of instructions', 'fde cycles', 'cycles'],
        'per second': ['each second', 'every second', 'in a second', 'a second']
      },
      hl: ['clock'] },
    { text: 'A clock speed of 2.4 GHz means 2.4 billion FDE cycles per second.',
      gaps: ['2.4 billion', 'per second'],
      accept: {
        '2.4 billion': ['2400 million', '2400000000', '2,400,000,000', '2.4 x 10^9', '2.4 thousand million'],
        'per second': ['each second', 'every second', 'in a second', 'a second']
      },
      hl: ['clock'] },
    { text: 'A higher clock speed means more instructions are processed per second.',
      gaps: ['more instructions', 'per second'],
      accept: {
        'more instructions': ['more fde cycles', 'more cycles', 'more fetch decode execute cycles'],
        'per second': ['each second', 'every second', 'in a second', 'a second']
      },
      hl: ['clock'] },
    { text: 'A core is a processing unit that can fetch, decode and execute instructions.',
      gaps: ['processing unit', 'fetch, decode and execute'],
      accept: {
        'processing unit': ['processor', 'independent processing unit', 'processing part'],
        'fetch, decode and execute': ['fetch decode and execute', 'fetch decode execute', 'fetch, decode, execute', 'process', 'run']
      },
      hl: ['core'] },
    { text: 'More cores means more instructions can be processed simultaneously.',
      gaps: ['simultaneously', 'more instructions'],
      accept: {
        'simultaneously': ['at the same time', 'at once', 'in parallel', 'together'],
        'more instructions': ['more fde cycles', 'more cycles']
      },
      hl: ['core'] },
    { text: 'When cores process instructions at the same time, it is called parallel processing.',
      gaps: ['parallel processing'],
      accept: { 'parallel processing': ['parallel'] },
      hl: ['core'] },
    { text: 'Doubling the cores may not double performance, as some software cannot be split across the cores.',
      gaps: ['split', 'software', 'may not'],
      accept: {
        'split': ['divided', 'shared', 'broken up', 'spread', 'run in parallel'],
        'software': ['programs', 'program', 'tasks', 'task', 'applications'],
        'may not': ['might not', 'does not always', 'will not always']
      },
      hl: ['core'] },
    { text: 'The cores must communicate with each other, which takes time.',
      gaps: ['communicate', 'takes time'],
      accept: {
        'communicate': ['talk', 'share data', 'send data', 'pass data'],
        'takes time': ['slows them down', 'is slow', 'adds time']
      },
      hl: ['core'] },
    { text: 'Cache is a small, fast memory that stores frequently used data and instructions.',
      gaps: ['frequently used', 'data and instructions', 'fast'],
      accept: {
        'frequently used': ['often used', 'commonly used', 'regularly used', 'used often', 'used frequently', 'used again and again'],
        'data and instructions': ['instructions and data', 'data', 'instructions'],
        'fast': ['quick', 'high speed', 'high-speed']
      },
      hl: ['cache'] },
    { text: 'Cache is faster to access than RAM.',
      gaps: ['RAM', 'faster'],
      accept: {
        'RAM': ['main memory', 'primary memory', 'random access memory'],
        'faster': ['quicker']
      },
      hl: ['cache', 'ram'] },
    { text: 'More cache means more frequently used data can be accessed faster, instead of from the slower RAM.',
      gaps: ['frequently used', 'slower RAM', 'faster'],
      accept: {
        'frequently used': ['often used', 'commonly used', 'regularly used', 'used often', 'used frequently'],
        'slower RAM': ['ram', 'main memory', 'slower main memory', 'primary memory'],
        'faster': ['quicker', 'more quickly', 'quickly']
      },
      hl: ['cache', 'ram'] },
    { text: 'To compare two CPUs, consider both the clock speed and the number of cores.',
      gaps: ['clock speed', 'number of cores', 'both'],
      accept: {
        'clock speed': ['clock', 'ghz', 'speed'],
        'number of cores': ['cores', 'core count', 'amount of cores'],
        'both': ['each']
      },
      hl: ['clock', 'core'] },
    { text: 'The CPU with more cores is only faster if the software can use parallel processing.',
      gaps: ['parallel processing', 'software', 'more cores'],
      accept: {
        'parallel processing': ['parallel', 'more than one core', 'all the cores', 'every core', 'multiple cores'],
        'software': ['program', 'programs', 'task', 'application'],
        'more cores': ['most cores', 'extra cores']
      },
      hl: ['core'] }
  ],
  quick: [
    { id: 'perf1', q: 'What does the CPU perform on each clock pulse?',
      accept: ['fde cycle', 'fde', 'fetch decode execute', 'fetch-decode-execute', 'fetch, decode, execute', 'fetch, decode and execute', 'one instruction', 'an instruction', 'fe cycle'],
      model: 'One FDE cycle' },
    { id: 'perf2', q: 'Name the component that controls the number of FDE cycles the CPU performs per second.',
      accept: ['clock', 'system clock'],
      model: 'The clock' },
    { id: 'perf3', q: 'A CPU has a clock speed of 2.4 GHz. State what this means.',
      accept: ['2.4 billion', '2400 million', '2400000000', '2,400,000,000', '2.4 x 10^9', '2.4 thousand million'],
      model: '2.4 billion FDE cycles per second' },
    { id: 'perf4', q: 'A CPU has a clock speed of 3 GHz. How many FDE cycles can it perform each second?',
      accept: ['3 billion', 'three billion', '3000 million', '3000000000', '3,000,000,000', '3 x 10^9'],
      model: '3 billion' },
    { id: 'perf5', q: 'Explain why a higher clock speed can improve the performance of a CPU.',
      accept: ['more instructions per second', 'more instructions each second', 'more instructions in a second', 'more instructions every second', 'more fde cycles per second', 'more fde cycles each second', 'more fde cycles in a second', 'more cycles per second', 'more cycles each second', 'more cycles in a second', 'more instructions a second', 'more cycles a second', 'more fde cycles a second', 'more instructions are processed per second', 'more instructions processed per second', 'more instructions fde cycles are processed per second'],
      model: 'More instructions (FDE cycles) are processed per second' },
    { id: 'perf6', q: 'State what is meant by a core.',
      accept: ['processing unit', 'fetch, decode and execute', 'fetch decode and execute', 'fetch decode execute', 'fetches, decodes and executes', 'performs the fde cycle', 'runs the fde cycle', 'executes instructions', 'processes instructions', 'execute instructions', 'process instructions', 'processor'],
      model: 'A processing unit that can fetch, decode and execute instructions' },
    { id: 'perf7', q: 'Explain why more cores can improve the performance of a CPU.',
      accept: ['simultaneously', 'at the same time', 'at once', 'in parallel', 'parallel processing'],
      model: 'More instructions can be processed simultaneously' },
    { id: 'perf8', q: 'What is it called when several cores process instructions at the same time?',
      accept: ['parallel processing', 'parallel'],
      model: 'Parallel processing' },
    { id: 'perf9', q: 'Give one reason why doubling the number of cores may not double the performance.',
      accept: ['split', 'divided', 'cannot use parallel', 'not use parallel', 'not all software', 'some software', 'some programs', 'some tasks', 'communicate', 'communication', 'communicating', 'only one core', 'only use one core'],
      model: 'Some software cannot be split across the cores' },
    { id: 'perf10', q: 'Apart from the software, what slows down a CPU that has many cores?',
      accept: ['communicate', 'communication', 'communicating', 'talk to each other', 'share data', 'send data to each other'],
      model: 'The cores must communicate with each other, which takes time' },
    { id: 'perf11', q: 'State what cache stores.',
      accept: ['frequently used', 'often used', 'commonly used', 'regularly used', 'used often', 'used frequently', 'used again and again', 'used a lot'],
      model: 'Frequently used data and instructions' },
    { id: 'perf12', q: 'Cache is faster to access than which memory?',
      accept: ['ram', 'main memory', 'primary memory', 'random access memory'],
      model: 'RAM' },
    { id: 'perf13', q: 'Explain why more cache can improve the performance of a CPU.',
      accept: ['frequently used', 'often used', 'commonly used', 'used often', 'faster than ram', 'faster to access', 'accessed faster', 'accessed more quickly', 'accessed quicker', 'instead of ram', 'instead of from ram', 'slower ram', 'less waiting', 'waits less', 'fewer fetches from ram'],
      model: 'More frequently used data can be accessed faster, instead of from the slower RAM' },
    { id: 'perf14', q: 'One computer has a dual-core 3.2 GHz CPU. Another has a quad-core 2.0 GHz CPU. Which two factors must you consider to compare them?',
      accept: ['clock speed and number of cores', 'clock speed and the number of cores', 'clock speed and cores', 'clock speed and core', 'number of cores and clock speed', 'cores and clock speed', 'cores and the clock speed', 'speed and cores', 'cores and speed', 'ghz and cores', 'cores and ghz', 'clock and cores', 'cores and clock'],
      model: 'The clock speed and the number of cores' },
    { id: 'perf15', q: 'A dual-core 3.2 GHz CPU is compared with a quad-core 2.0 GHz CPU. Explain one way the 3.2 GHz CPU may perform better.',
      accept: ['more instructions per second', 'more instructions each second', 'more instructions in a second', 'more fde cycles per second', 'more fde cycles each second', 'more fde cycles in a second', 'more cycles per second', 'more cycles each second', 'more cycles in a second', 'higher clock speed', 'faster clock speed', 'communication', 'communicate'],
      model: 'It has a higher clock speed, so it processes more instructions per second' },
    { id: 'perf16', q: 'A dual-core 3.2 GHz CPU is compared with a quad-core 2.0 GHz CPU. Explain one way the quad-core CPU may perform better.',
      accept: ['simultaneously', 'at the same time', 'at once', 'in parallel', 'parallel processing'],
      model: 'It has more cores, so more instructions can be processed simultaneously' },
    { id: 'perf17', q: 'A CPU with more cores is only faster if the software can do what?',
      accept: ['parallel processing', 'parallel', 'be split', 'split', 'divided', 'use all the cores', 'use more cores', 'use the cores', 'use multiple cores', 'use every core', 'use more than one core'],
      model: 'Use parallel processing (be split across the cores)' }
  ],
  spot: [
    { wrong: 'A clock speed of 2.4 GHz means 2.4 million FDE cycles per second.', fix: ['billion'],
      model: 'A clock speed of 2.4 GHz means 2.4 billion FDE cycles per second.' },
    { wrong: 'A core is a storage unit that can fetch, decode and execute instructions.', fix: ['processing unit', 'processing', 'processor'],
      model: 'A core is a processing unit that can fetch, decode and execute instructions.' },
    { wrong: 'Cache stores rarely used data and instructions.', fix: ['frequently used', 'frequently', 'often used', 'commonly used', 'regularly used'],
      model: 'Cache stores frequently used data and instructions.' },
    { wrong: 'Cache is slower to access than RAM.', fix: ['faster', 'quicker'],
      model: 'Cache is faster to access than RAM.' },
    { wrong: 'Doubling the cores always doubles the performance.', fix: ['may not', 'might not', 'does not always', 'not always', 'may'],
      model: 'Doubling the cores may not double the performance.' }
  ]
};
