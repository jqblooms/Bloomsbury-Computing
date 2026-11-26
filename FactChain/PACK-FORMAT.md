# Fact Chain packs

Fact Chain (`FactChain/index.html?pack=<id>` or `?group=<id>`) is a memorisation drill. It is built on retrieval practice, criterion learning, fading cues and spacing. James asked for it on 2026-11-26, first for the Year 10 Unit 3.1 exam (`y10-unit3-1-exam` in the shell's ExamPapers.gs).

Each pack is one file, `FactChain/packs/<id>.js`, that registers itself:

```js
window.FACT_CHAIN_PACKS = window.FACT_CHAIN_PACKS || {};
window.FACT_CHAIN_PACKS['y10-fde'] = {
  id: 'y10-fde',
  title: 'The Fetch Stage',          // short, plain
  year: 'Year 10',
  part: 'buses',                     // the CPU part this pack adds in "Build your CPU" (see the diagram ids below)
  intro: 'One line on what this pack is about.',
  // The chain: 6 to 14 short facts in a fixed order (a sequence when the topic is one, such as FDE steps; otherwise
  // the order they are best learned in). Exact syllabus and mark scheme wording, one idea per line.
  chain: [
    { text: 'The PC holds the address of the next instruction.',
      gaps: ['PC', 'address', 'next instruction'],   // words or phrases in `text` to blank, most important first; fading blanks 1, then 2, then the whole line
      accept: { 'PC': ['pc', 'program counter'] },    // optional extra answers for a gap (case-insensitive; the gap text itself is always accepted)
      hl: ['pc'] },                                  // diagram ids to light up for this fact (optional)
    ...
  ],
  // Quick-fire: 8 to 20 one-line questions on the same facts, typed answers. Mastered by the Practice Sets rule:
  // 2 right in a row; a wrong one comes back 3 later and then needs 3 in a row.
  quick: [
    { id: 'q1', q: 'Which register holds the address of the next instruction?',
      accept: ['program counter', 'pc'],             // keyword match: the answer contains one of these as whole words (case-insensitive)
      model: 'Program counter (PC)' },               // shown after every answer
    ...
  ],
  // Spot the mistake: 3 to 6 statements with ONE wrong word or phrase. The student types the right word.
  spot: [
    { wrong: 'The MDR holds the address of the next instruction.', fix: ['pc', 'program counter'], model: 'The PC holds the address of the next instruction.' },
    ...
  ]
};
```

## Rules for content
- **Source:** every fact comes from a real 0478 mark scheme. The extract is `C:\Users\Bloomsbury\Desktop\0478 Past Papers\extract\` (by-topic.md, papers/*.md). The shell's `ExamPapers.gs` `y10-unit3-1-exam` schemes and the Y10 Exam Game sets (`ExamGameSetY10*.gs`, `ExamGameSetY11Arch*.gs`) hold the same. Use the wording examiners give marks for.
- **No copying the exam:** never copy a question from `y10-unit3-1-exam` as a quick-fire question. Teach the facts its mark scheme rewards, in your own one-line questions.
- **Wording:** plain short English for EAL students. No em or en dashes, no emoji. Syllabus terms only ("denary", never "decimal"). No term used before the pack teaches it.
- **Gaps:** the blanked word must be guessable only from knowing the fact, never from grammar ("an ___" giving away a vowel is fine to avoid by rewording). A gap accepts its listed synonyms.
- **Accept lists:** generous on equivalent wording an examiner would accept, but a bare restatement of the question never matches. Haiku second-checks any typed answer the keywords reject (op `drillCheck`), so the keyword list can stay precise.

## Diagram ids (the CPU diagram in the engine)
`cpu, pc, mar, mdr, cir, acc, alu, cu, clock, cache, core, addressBus, dataBus, controlBus, ram, sensor, adc, actuator, device`

## Packs for the Year 10 Unit 3.1 exam (group `y10-3-1`)
1. `y10-cpu-parts`: the CPU's role, ALU, CU, registers and what each holds (PC, MAR, MDR, CIR, ACC), what a register is.
2. `y10-buses-fde`: address, data and control buses (what each carries, direction), the fetch stage step by step (PC, MAR, address bus, RAM, data bus, MDR, CIR, PC incremented), decode (CU, instruction set) and execute.
3. `y10-performance`: clock (what it does, GHz meaning), cores, cache, how more of each affects performance and why it may not, comparing two CPUs.
4. `y10-instruction-sets`: instruction set definition, opcode and operand at the level taught.
5. `y10-embedded`: embedded system definition and features (dedicated function, microprocessor, not reprogrammable by the user), examples, not a general purpose computer.
6. `y10-control`: a microprocessor with a sensor controlling a device, in the order mark schemes reward: sensor takes readings, sent to the microprocessor (ADC if analogue), compared with a stored value or range, signal sent to the actuator or output, continuous loop. Cover the parking-space light and the air-conditioner examples as general patterns, with different devices from the exam's.
