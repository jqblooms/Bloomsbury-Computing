// Fact Chain registry: every group and its packs, in order, with the year each is for. The Fact Chain app
// (?group=<id>) and Data Bridge (topic picker "Fact Chain", ?facts=<group or pack>) read this list. A pack listed
// here whose file is missing or incomplete is skipped. A new pack: add its file to FactChain/packs/ and its id here.
// The shell's FactChain.gs FACT_GROUPS must list the same groups and packs (progress is saved per group).
window.FACT_CHAIN_INDEX = {
  groups: {
    'y10-3-1': { title: 'Computer Architecture', year: 'Year 10',
      packs: ['y10-cpu-parts', 'y10-buses-fde', 'y10-performance', 'y10-instruction-sets', 'y10-embedded', 'y10-control'] },
    'y8-term1b': { title: 'Programming Facts', year: 'Year 8',
      packs: ['y8-libraries-types', 'y8-conditions-logic'] }
  }
};
