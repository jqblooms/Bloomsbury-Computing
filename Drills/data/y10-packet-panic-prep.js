// Year 10, Packet Panic Prep
// Loaded by Drills/index.html?drill=y10-packet-panic-prep
DrillData.register("y10-packet-panic-prep", {
  title: "Year 10, Packet Panic Prep",
  subtitle: "The rules you need before playing Packet Panic (1.3)",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["pp-units", "Units Ladder"],
    ["pp-formula", "File Size Formulas"],
    ["pp-method", "Compression Choices"]
  ],
  cards: [
    {
      id: "pp-nibble", category: "pp-units",
      prompt: "How many bits are in a nibble?",
      answers: ["4 bits"],
      keywords: [/^\s*4\s*(bits?)?\s*$/i],
      distractors: ["8 bits", "2 bits", "16 bits"],
      note: "A nibble is half a byte: 4 bits."
    },
    {
      id: "pp-byte", category: "pp-units",
      prompt: "How many bits are in a byte?",
      answers: ["8 bits"],
      keywords: [/^\s*8\s*(bits?)?\s*$/i],
      distractors: ["4 bits", "16 bits", "1024 bits"],
      note: "1 byte = 8 bits = 2 nibbles."
    },
    {
      id: "pp-kib", category: "pp-units",
      prompt: "How many bytes are in 1 KiB?",
      answers: ["1024 bytes"],
      keywords: [/^\s*1,?024\s*(bytes?)?\s*$/i],
      distractors: ["1000 bytes", "8 bytes", "8192 bytes"],
      note: "Every step from bytes upwards is 1024, never 1000."
    },
    {
      id: "pp-ladder", category: "pp-units",
      prompt: "Put these in order, smallest first: KiB, byte, MiB, bit, nibble, GiB",
      answers: ["bit, nibble, byte, KiB, MiB, GiB"],
      keywords: [/bit\W+nibble\W+byte\W+kib\W+mib\W+gib/i],
      distractors: ["byte, bit, nibble, KiB, MiB, GiB", "bit, byte, nibble, KiB, GiB, MiB", "nibble, bit, byte, MiB, KiB, GiB"],
      note: "bit, nibble, byte, KiB, MiB, GiB, TiB, PiB, EiB."
    },
    {
      id: "pp-down", category: "pp-units",
      prompt: "Going DOWN to a smaller unit (e.g. MiB to KiB), do you multiply or divide?",
      answers: ["Multiply"],
      keywords: [/^\s*multiply(ing)?(\s+by\s+1024)?\s*$/i],
      distractors: ["Divide"],
      note: "A smaller unit needs more of them, so multiply."
    },
    {
      id: "pp-up", category: "pp-units",
      prompt: "Going UP to a bigger unit (e.g. bytes to KiB), do you multiply or divide?",
      answers: ["Divide"],
      keywords: [/^\s*divid(e|ing)(\s+by\s+1024)?\s*$/i],
      distractors: ["Multiply"],
      note: "A bigger unit needs fewer of them, so divide."
    },
    {
      id: "pp-img", category: "pp-formula",
      prompt: "Image file size in bits = ?",
      answers: ["width x height x colour depth"],
      keywords: [/width\s*(x|\*|times|by|×)\s*height\s*(x|\*|times|by|×)\s*(colou?r|bit)\s*depth/i, /multipl\w*.*width.*height.*(colou?r|bit)\s*depth/i],
      distractors: ["width + height + colour depth", "width x height", "sample rate x sample resolution x seconds"],
      note: "Pixels (width x height) times the bits for each pixel."
    },
    {
      id: "pp-snd", category: "pp-formula",
      prompt: "Sound file size in bits = ?",
      answers: ["sample rate x sample resolution x seconds"],
      keywords: [/rate.*resolution.*(second|length|time|duration)/i],
      distractors: ["sample rate x seconds", "width x height x colour depth", "sample rate + sample resolution"],
      note: "Samples per second, times bits per sample, times seconds."
    },
    {
      id: "pp-bits-bytes", category: "pp-formula",
      prompt: "You have a size in bits. What do you divide by to get bytes?",
      answers: ["8"],
      keywords: [/^\s*(by\s+)?8\s*$/i],
      distractors: ["1024", "4", "1000"],
      note: "8 bits in a byte."
    },
    {
      id: "pp-depth-bytes", category: "pp-formula",
      prompt: "Colour depth is given as 2 BYTES. Do you still divide by 8 at the end to get bytes?",
      answers: ["No"],
      keywords: [/^\s*no\b/i],
      distractors: ["Yes"],
      note: "width x height x bytes already gives bytes."
    },
    {
      id: "pp-minutes", category: "pp-formula",
      prompt: "A sound lasts 2 minutes. What number of seconds goes in the formula?",
      answers: ["120"],
      keywords: [/^\s*120\s*(s|secs?|seconds?)?\s*$/i],
      distractors: ["2", "60", "200"],
      note: "Change minutes to seconds first: 2 x 60 = 120."
    },
    {
      id: "pp-lossy", category: "pp-method",
      prompt: "Which type of compression permanently removes data?",
      answers: ["Lossy"],
      keywords: [/^\s*lossy(\s+compression)?\s*$/i],
      distractors: ["Lossless"],
      note: "Lossy data can never be put back."
    },
    {
      id: "pp-lossy-how", category: "pp-method",
      prompt: "Name one way to make an image smaller using lossy compression.",
      answers: ["Reduce the resolution"],
      keywords: [/(reduc|lower|decreas|fewer|less).*(resolution|colou?r\s*depth|pixel)/i],
      distractors: ["Run length encoding", "Increase the colour depth", "Encrypt it"],
      note: "Lower the resolution or the colour depth."
    },
    {
      id: "pp-text", category: "pp-method",
      prompt: "A contract document must be compressed. Lossy or lossless?",
      answers: ["Lossless"],
      keywords: [/^\s*lossless(\s+compression)?\s*$/i],
      distractors: ["Lossy"],
      note: "Every character matters, so nothing can be lost."
    },
    {
      id: "pp-photo", category: "pp-method",
      prompt: "A holiday photo for a social media post: lossy or lossless?",
      answers: ["Lossy"],
      keywords: [/^\s*lossy(\s+compression)?\s*$/i],
      distractors: ["Lossless"],
      note: "Photos have few long runs and a little lost detail is fine."
    },
    {
      id: "pp-rle", category: "pp-method",
      prompt: "Encode WWWWBBW using run length encoding.",
      answers: ["4W 2B 1W"],
      keywords: [/^\s*4\s*W[\s,]*2\s*B[\s,]*1\s*W\s*$/i],
      distractors: ["W4 B2 W1", "4W 3B", "4 2 1"],
      note: "Count each run, then write the colour: 4W 2B 1W."
    }
  ]
});
