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

## Optional fields (Year 8 and other packs without the CPU)
- `group`: the group id the pack belongs to (also listed in `packs/index.js`).
- `part` and `hl` are optional. A group whose packs have no `part` shows no CPU diagram: the app hides it and shows a simple row of packs as the progress picture, and "Build your CPU" and the Lightning bus trip are left out.
- `code`: a list of program lines (Cambridge pseudocode, DECLARE before use), e.g. `code: ['DECLARE Age : INTEGER', 'Age <- 13']`, on a chain line, a quick-fire question or a spot item. It is shown under the text as the site's exam code block (shared/exam-question.js `.eq-code`), in Fact Chain and in Data Bridge. Answers are never symbols alone: logic.js ignores `< > =`, so take operator answers in words.

## The registry: `packs/index.js`
`window.FACT_CHAIN_INDEX.groups` lists every group: `{ title, year, packs: [ids in order] }`. The Fact Chain app (`?group=<id>`) and Data Bridge read it. A new pack needs its id there, and the shell's `FactChain.gs` `FACT_GROUPS` must list the same group and packs (progress is saved per group). A listed pack whose file is missing is skipped.

## In Data Bridge
Data Bridge's topic picker lists every loaded pack, and each group as "All ... facts", under "Fact Chain" in the pack's year. `BridgeBuilder/index.html?facts=<group or pack>` starts on them (lesson embeds). Each Data Bridge round is one short activity from the pack (`js/rounds.js`): Fill the gaps (1 gap, then 2), Write the fact, Put it in order, Spot the mistake, Quick-fire, From memory, cycling as the rounds go up. Card ids for the Haiku check: quick `id`, `line<n>`, `spot<n>`.

## Rules for content
- **Source:** every fact comes from a real 0478 mark scheme. The extract is `C:\Users\Bloomsbury\Desktop\0478 Past Papers\extract\` (by-topic.md, papers/*.md). The shell's `ExamPapers.gs` `y10-unit3-1-exam` schemes and the Y10 Exam Game sets (`ExamGameSetY10*.gs`, `ExamGameSetY11Arch*.gs`) hold the same. Use the wording examiners give marks for.
- **No copying the exam:** never copy a question from `y10-unit3-1-exam` as a quick-fire question. Teach the facts its mark scheme rewards, in your own one-line questions.
- **Wording:** plain short English for EAL students. No em or en dashes, no emoji. Syllabus terms only ("denary", never "decimal"). No term used before the pack teaches it.
- **Gaps:** the blanked word must be guessable only from knowing the fact, never from grammar ("an ___" giving away a vowel is fine to avoid by rewording). A gap accepts its listed synonyms.
- **Accept lists:** generous on equivalent wording an examiner would accept, but a bare restatement of the question never matches. Haiku second-checks any typed answer the keywords reject (op `drillCheck`), so the keyword list can stay precise.

## Diagram ids (the CPU diagram in the engine)
`cpu, pc, mar, mdr, cir, acc, alu, cu, clock, cache, core, addressBus, dataBus, controlBus, ram, sensor, adc, actuator, device`

## Packs for Year 8 Term 1b (group `y8-term1b`, app `y8-fact-chain`)
`y8-libraries-types`, `y8-conditions-logic`.

## Packs for the Year 10 Unit 3.1 exam (group `y10-3-1`)
1. `y10-cpu-parts`: the CPU's role, ALU, CU, registers and what each holds (PC, MAR, MDR, CIR, ACC), what a register is.
2. `y10-buses-fde`: address, data and control buses (what each carries, direction), the fetch stage step by step (PC, MAR, address bus, RAM, data bus, MDR, CIR, PC incremented), decode (CU, instruction set) and execute.
3. `y10-performance`: clock (what it does, GHz meaning), cores, cache, how more of each affects performance and why it may not, comparing two CPUs.
4. `y10-instruction-sets`: instruction set definition, opcode and operand at the level taught.
5. `y10-embedded`: embedded system definition and features (dedicated function, microprocessor, not reprogrammable by the user), examples, not a general purpose computer.
6. `y10-control`: a microprocessor with a sensor controlling a device, in the order mark schemes reward: sensor takes readings, sent to the microprocessor (ADC if analogue), compared with a stored value or range, signal sent to the actuator or output, continuous loop. Cover the parking-space light and the air-conditioner examples as general patterns, with different devices from the exam's.

## Order rounds only for real sequences
James 2026-11-26: facts with no order are never put in order. A pack may give `sequences: [[chain index, ...], ...]`, each list in its true order (at least 3 steps). The Put it in order round, in the Fact Chain app and in Data Bridge, uses only these; a pack without `sequences` has no order round. Leave out any step whose timing varies between sources (for example the PC increment in the fetch stage).

## Gaps must be answerable from knowledge, not from memory of the sentence (James 2026-11-26)
James: "the sentences often don't imply what text is required ... even if you knew the answer you wouldn't know what to put. You'd only know because you've seen that specific sentence stem before."
- **A gap is only ever a key term or key value that the rest of the sentence pins down.** Someone who knows the topic but has never seen the sentence must give exactly that answer, or an accepted synonym. Good: "The ___ holds the address of the next instruction." (PC). "MOD gives the ___ of a division." (remainder). "2.4 GHz means 2.4 ___ FDE cycles per second." (billion).
- **Never gap** verbs or filler ("processes", "runs", "carries out", "means", "includes"), words with several right answers ("data", "instructions"), or one item of a list whose items could swap places ("The ALU, the ___ and the registers"). Never gap a word the sentence itself gives away.
- **Give the sentence the cue it needs.** Rewrite it so the definition or description points at one term: "The part of the CPU that decodes instructions is the ___." beats "The ___ decodes the instructions."
- **One gap per line is fine.** A second gap is only allowed if each gap is still pinned down when the other one is blank. Mark that with gaps ordered most-pinned first, because round B blanks the first two.
- **`ask` (required on every chain line):** a short question whose answer is the whole fact, for example "What does the PC hold?" It is the cue in the "write the whole fact" round, so a student answers from knowing the topic, never from "the fact before it". The marking checks the line's gaps, with Haiku as a second check.
- Accept lists cover every synonym an examiner would accept.
- **Quick-fire questions and spot items** follow the same test: the question must point at one answer.
