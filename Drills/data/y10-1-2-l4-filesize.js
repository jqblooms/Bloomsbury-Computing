// Year 10, 1.2 L4: File Size
// Loaded by Drills/index.html?drill=y10-1-2-l4-filesize
DrillData.register("y10-1-2-l4-filesize", {
  title: "Year 10, 1.2 L4: File Size",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["fsunits", "Units and the x1024 Ladder"],
    ["fstext", "Text File Size"],
    ["fsimage", "Image File Size"],
    ["fssound", "Sound File Size"]
  ],
  cards: [
    {
      id: "fsu-nibble", category: "fsunits",
      prompt: "How many bits are there in 1 nibble?",
      answers: ["4 bits"],
      keywords: [/^\s*4\s*(bits?)?\s*$/i],
      distractors: ["8 bits", "2 bits", "16 bits", "1 bit", "1024 bits", "6 bits"],
      note: "A nibble is half a byte: 4 bits."
    },
    {
      id: "fsu-byte", category: "fsunits",
      prompt: "How many bits are there in 1 byte?",
      answers: ["8 bits"],
      keywords: [/^\s*8\s*(bits?)?\s*$/i],
      distractors: ["4 bits", "16 bits", "1024 bits", "2 bits", "10 bits", "1000 bits"],
      note: "1 byte = 8 bits = 2 nibbles."
    },
    {
      id: "fsu-kib-bytes", category: "fsunits",
      prompt: "How many bytes are there in 1 kibibyte (KiB)?",
      answers: ["1024 bytes"],
      keywords: [/^\s*1[\s,]?024\s*(bytes?|b)?\s*$/i],
      distractors: ["1000 bytes", "1024 bits", "8 bytes", "512 bytes", "2048 bytes", "100 bytes"],
      note: "Every step of the ladder is x1024: 1 KiB = 1024 bytes."
    },
    {
      id: "fsu-kib-bits", category: "fsunits",
      prompt: "How many bits are there in 1 kibibyte (KiB)?",
      answers: ["8192 bits"],
      keywords: [/^\s*8[\s,]?192\s*(bits?)?\s*$/i],
      distractors: ["1024 bits", "1000 bits", "8000 bits", "4096 bits", "128 bits", "16384 bits"],
      note: "1 KiB = 1024 bytes, and each byte is 8 bits: 1024 x 8 = 8192 bits."
    },
    {
      id: "fsu-bytes-nibbles", category: "fsunits",
      prompt: "8 bytes = how many nibbles?",
      answers: ["16 nibbles"],
      keywords: [/^\s*16\s*(nibbles?)?\s*$/i],
      distractors: ["4 nibbles", "32 nibbles", "2 nibbles", "64 nibbles", "8 nibbles", "1 nibble"],
      note: "1 byte is 2 nibbles, so multiply the byte count by 2."
    },
    {
      id: "fsu-kib-mib", category: "fsunits",
      prompt: "512 kibibytes (KiB) = how many mebibytes (MiB)?",
      answers: ["0.5 MiB"],
      keywords: [/^\s*0?\.5\s*(mib|mebibytes?)?\s*$/i, /^\s*(a\s+)?half(\s+(a\s+)?(mib|mebibyte))?\s*$/i],
      distractors: ["2 MiB", "512 MiB", "5 MiB", "0.05 MiB", "1 MiB", "51.2 MiB"],
      note: "Divide by 1024 to move up one step of the ladder: 512 / 1024 = 0.5."
    },
    {
      id: "fsu-gib-mib", category: "fsunits",
      prompt: "4 gibibytes (GiB) = how many mebibytes (MiB)?",
      answers: ["4096 MiB"],
      keywords: [/^\s*4[\s,]?096\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["4000 MiB", "1024 MiB", "400 MiB", "2048 MiB", "40 MiB", "8192 MiB"],
      note: "Multiply by 1024 to move down one step of the ladder: 4 x 1024 = 4096."
    },
    {
      id: "fsu-eib-pib", category: "fsunits",
      prompt: "1 exbibyte (EiB) = how many pebibytes (PiB)?",
      answers: ["1024 PiB"],
      keywords: [/^\s*1[\s,]?024\s*(pib|pebibytes?)?\s*$/i],
      distractors: ["1000 PiB", "8 PiB", "512 PiB", "2048 PiB", "100 PiB", "1 PiB"],
      note: "Every step of the ladder is the same x1024 jump, all the way up to exbibytes."
    },
    {
      id: "fst-25x8", category: "fstext",
      prompt: "Calculate the number of bits needed to store a text file of 25 characters using 8-bit extended ASCII.",
      answers: ["200 bits"],
      keywords: [/^\s*200\s*(bits?)?\s*$/i],
      distractors: ["25 bits", "33 bits", "400 bits", "2000 bits", "100 bits", "800 bits"],
      note: "Multiply the character count by the bits used for each character: 25 x 8 = 200."
    },
    {
      id: "fst-20x16-bytes", category: "fstext",
      prompt: "Calculate the file size, in bytes, of a 20-character message stored using 16-bit Unicode.",
      answers: ["40 bytes"],
      keywords: [/^\s*40\s*(bytes?|b)?\s*$/i],
      distractors: ["320 bytes", "20 bytes", "16 bytes", "80 bytes", "160 bytes", "10 bytes"],
      note: "20 x 16 = 320 bits, and 320 / 8 = 40 bytes."
    },
    {
      id: "fst-60x8-bytes", category: "fstext",
      prompt: "A text file has 60 characters, each stored in 8 bits. Calculate its file size in bytes.",
      answers: ["60 bytes"],
      keywords: [/^\s*60\s*(bytes?|b)?\s*$/i],
      distractors: ["480 bytes", "8 bytes", "120 bytes", "30 bytes", "600 bytes", "68 bytes"],
      note: "60 x 8 = 480 bits, and 480 / 8 = 60 bytes - with 8 bits per character, bytes equals the character count."
    },
    {
      id: "fst-rule", category: "fstext",
      prompt: "Describe how to calculate the file size, in bits, of a text file.",
      answers: ["Multiply the number of characters by the bits used per character"],
      // The optional/need shape let "add"/"divide the number of
      // characters..." through (the required words alone don't say
      // MULTIPLY), let "...number of WORDS..." through (it still says
      // "per character" at the end), and let "...by the number of
      // lines"/"...by the colour depth" through (both still say
      // "number of characters" and share several other words) - a
      // regex anchors "multiply", "number of character(s)" AND
      // "bits...per character" as one ordered chain, which none of
      // those distractors have all three of.
      keywords: [/multiply.*number\s+of\s+characters?.*bits?.*per\s*character/i],
      distractors: [
        "Multiply the number of words by the bits used per character",
        "Add the number of characters to the bits used per character",
        "Multiply the number of characters by the number of lines",
        "Divide the number of characters by the bits used per character",
        "Multiply the number of characters by the colour depth",
        "Count the characters and divide by 8 to get bits"
      ],
      note: "File size in bits = number of characters x bits per character. Divide by 8 for bytes."
    },
    {
      id: "fsi-512-16", category: "fsimage",
      prompt: "A 16-bit colour image is 512 pixels wide by 512 pixels high. Calculate its file size in kibibytes (KiB).",
      answers: ["512 KiB"],
      keywords: [/^\s*512\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["4096 KiB", "256 KiB", "0.5 KiB", "1024 KiB", "16 KiB", "64 KiB"],
      note: "512 x 512 x 16 = 4,194,304 bits. Divide by 8 for bytes (524,288), then by 1024 for KiB = 512."
    },
    {
      id: "fsi-1024-2b", category: "fsimage",
      prompt: "An image is 1024 pixels high by 1024 pixels wide with a colour depth of two bytes. Calculate its file size in MiB.",
      answers: ["2 MiB"],
      keywords: [/^\s*2\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["1 MiB", "16 MiB", "4 MiB", "1024 MiB", "8 MiB", "0.5 MiB"],
      note: "1024 x 1024 = 1,048,576 pixels, x 2 bytes = 2,097,152 bytes. Divide by 1024 twice (KiB, then MiB) = 2 MiB."
    },
    {
      id: "fsi-100-8", category: "fsimage",
      prompt: "An image is 100 pixels wide by 100 pixels high with an 8-bit colour depth. Calculate its file size in bits.",
      answers: ["80000 bits"],
      keywords: [/^\s*80[\s,]?000\s*(bits?)?\s*$/i],
      distractors: ["10000 bits", "800 bits", "8000 bits", "1600 bits", "100000 bits", "10 bits"],
      note: "Width x height x colour depth: 100 x 100 x 8 = 80,000 bits."
    },
    {
      id: "fsi-256-1b", category: "fsimage",
      prompt: "An image is 256 pixels wide by 256 pixels high, storing 1 byte per pixel. Calculate its file size in kibibytes (KiB).",
      answers: ["64 KiB"],
      keywords: [/^\s*64\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["256 KiB", "65536 KiB", "8 KiB", "32 KiB", "512 KiB", "128 KiB"],
      note: "256 x 256 = 65,536 bytes. Divide by 1024 = 64 KiB."
    },
    {
      id: "fss-4-20-8-bits", category: "fssound",
      prompt: "A recording lasts 4 seconds, sampled at 20 samples per second with an 8-bit sample resolution. Calculate the number of bits in the whole recording.",
      answers: ["640 bits"],
      keywords: [/^\s*640\s*(bits?)?\s*$/i],
      distractors: ["160 bits", "80 bits", "32 bits", "320 bits", "128 bits", "6400 bits"],
      note: "Bits per second first (rate x resolution = 20 x 8 = 160), then multiply by the duration: 160 x 4 = 640."
    },
    {
      id: "fss-4-20-8-bytes", category: "fssound",
      prompt: "A recording lasts 4 seconds, sampled at 20 samples per second with an 8-bit sample resolution. Calculate its file size in bytes.",
      answers: ["80 bytes"],
      keywords: [/^\s*80\s*(bytes?|b)?\s*$/i],
      distractors: ["640 bytes", "160 bytes", "20 bytes", "8 bytes", "40 bytes", "800 bytes"],
      note: "640 bits in total, and 640 / 8 = 80 bytes."
    },
    {
      id: "fss-3-10-8-bytes", category: "fssound",
      prompt: "A sound recording lasts 3 seconds, sampled at 10 samples per second with an 8-bit sample resolution. Calculate its file size in bytes.",
      answers: ["30 bytes"],
      keywords: [/^\s*30\s*(bytes?|b)?\s*$/i],
      distractors: ["240 bytes", "80 bytes", "24 bytes", "3 bytes", "10 bytes", "300 bytes"],
      note: "10 x 8 = 80 bits per second, x 3 seconds = 240 bits, / 8 = 30 bytes."
    },
    {
      id: "fss-2-50-4-bits", category: "fssound",
      prompt: "A recording lasts 2 seconds, sampled at 50 samples per second with a 4-bit sample resolution. Calculate the number of bits in the whole recording.",
      answers: ["400 bits"],
      keywords: [/^\s*400\s*(bits?)?\s*$/i],
      distractors: ["100 bits", "200 bits", "50 bits", "800 bits", "56 bits", "4000 bits"],
      note: "50 x 4 = 200 bits per second, x 2 seconds = 400 bits."
    }
  ]
});
