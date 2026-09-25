// Year 10, 1.3 L1: Storage Units
// Loaded by Drills/index.html?drill=y10-1-3-l1-units
DrillData.register("y10-1-3-l1-units", {
  title: "Year 10, 1.3 L1: Storage Units",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["u13-ladder", "The Unit Ladder"],
    ["u13-convert", "Converting One Step"],
    ["u13-multi", "Converting Several Steps"]
  ],
  cards: [
    {
      id: "u13-nibble-bits", category: "u13-ladder",
      prompt: "How many bits are in 1 nibble?",
      answers: ["4 bits"],
      keywords: [/^\s*4\s*(bits?)?\s*$/i],
      distractors: ["8 bits", "2 bits", "16 bits", "1024 bits"],
      note: "A nibble is 4 bits, half of a byte."
    },
    {
      id: "u13-byte-nibbles", category: "u13-ladder",
      prompt: "How many nibbles are in 1 byte?",
      answers: ["2 nibbles"],
      keywords: [/^\s*2\s*(nibbles?)?\s*$/i],
      distractors: ["4 nibbles", "8 nibbles", "16 nibbles", "1 nibble"],
      note: "8 bits / 4 bits = 2 nibbles. This is 0478/12 June 2025 Question 2(b)(ii)."
    },
    {
      id: "u13-8-bits-name", category: "u13-ladder",
      prompt: "Give the name of the data storage unit equal to 8 bits.",
      answers: ["Byte"],
      keywords: [/^\s*(a\s+|1\s+)?bytes?\s*$/i],
      distractors: ["Nibble", "Kibibyte", "Word", "Bit"],
      note: "8 bits = 1 byte. A nibble is only 4 bits."
    },
    {
      id: "u13-smallest", category: "u13-ladder",
      prompt: "Which is the smallest unit: byte, gibibyte, kibibyte or nibble?",
      answers: ["Nibble"],
      keywords: [/^\s*(a\s+)?nibbles?\s*$/i],
      distractors: ["Byte", "Kibibyte", "Gibibyte"],
      note: "A nibble is half a byte. From 0478/11 June 2025 Question 1(a)."
    },
    {
      id: "u13-1024-gib-name", category: "u13-ladder",
      prompt: "Give the name of the data storage unit equal to 1024 gibibytes (GiB).",
      answers: ["Tebibyte (TiB)"],
      keywords: [/^\s*(a\s+)?(tebibytes?|tib)(\s*\(tib\))?\s*$/i],
      distractors: ["Mebibyte (MiB)", "Pebibyte (PiB)", "Exbibyte (EiB)", "Kibibyte (KiB)"],
      note: "The ladder goes GiB, TiB, PiB, EiB. 1024 GiB is 1 TiB."
    },
    {
      id: "u13-after-pib", category: "u13-ladder",
      prompt: "Which unit is equal to 1024 pebibytes (PiB)?",
      answers: ["Exbibyte (EiB)"],
      keywords: [/^\s*(an?\s+)?(exbibytes?|eib)(\s*\(eib\))?\s*$/i],
      distractors: ["Tebibyte (TiB)", "Gibibyte (GiB)", "Mebibyte (MiB)", "Kibibyte (KiB)"],
      note: "1 EiB = 1024 PiB. The exbibyte is the largest unit on the syllabus."
    },
    {
      id: "u13-why-1024", category: "u13-ladder",
      prompt: "Storage calculations in the exam must use which number for each step up the ladder, 1000 or 1024?",
      answers: ["1024"],
      keywords: [/^\s*1024\s*$/],
      distractors: ["1000", "8", "100", "2048"],
      note: "Binary units go up in powers of 2, so each step is 1024. Using 1000 loses the mark."
    },
    {
      id: "u13-5-mib-kib", category: "u13-convert",
      prompt: "Convert 5 MiB to KiB.",
      answers: ["5120 KiB"],
      keywords: [/^\s*5[,\s]?120\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["5000 KiB", "0.005 KiB", "40 KiB", "1024 KiB", "640 KiB"],
      note: "5 x 1024 = 5120 KiB."
    },
    {
      id: "u13-2048-kib-mib", category: "u13-convert",
      prompt: "Convert 2048 KiB to MiB.",
      answers: ["2 MiB"],
      keywords: [/^\s*2\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["2.048 MiB", "2097152 MiB", "256 MiB", "4 MiB", "0.5 MiB"],
      note: "2048 / 1024 = 2 MiB."
    },
    {
      id: "u13-3072-bytes-kib", category: "u13-convert",
      prompt: "An image file is 3072 bytes. Give its size in KiB.",
      answers: ["3 KiB"],
      keywords: [/^\s*3\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["3.072 KiB", "384 KiB", "24 KiB", "3072 KiB", "6 KiB"],
      note: "3072 / 1024 = 3 KiB. This is 0478/12 June 2025 Question 2(b)(i)."
    },
    {
      id: "u13-2-pib-tib", category: "u13-convert",
      prompt: "How many tebibytes (TiB) are equal to 2 pebibytes (PiB)?",
      answers: ["2048 TiB"],
      keywords: [/^\s*2[,\s]?048\s*(tib|tebibytes?)?\s*$/i],
      distractors: ["2000 TiB", "1024 TiB", "4096 TiB", "0.002 TiB", "512 TiB"],
      note: "2 x 1024 = 2048 TiB. This is 0478/11 June 2025 Question 1(b)."
    },
    {
      id: "u13-3-gib-mib", category: "u13-convert",
      prompt: "Convert 3 GiB to MiB.",
      answers: ["3072 MiB"],
      keywords: [/^\s*3[,\s]?072\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["3000 MiB", "3 MiB", "24 MiB", "0.003 MiB", "1024 MiB"],
      note: "3 x 1024 = 3072 MiB."
    },
    {
      id: "u13-12-nibbles-bytes", category: "u13-convert",
      prompt: "Convert 12 nibbles to bytes.",
      answers: ["6 bytes"],
      keywords: [/^\s*6\s*(bytes?|b)?\s*$/i],
      distractors: ["24 bytes", "48 bytes", "3 bytes", "96 bytes"],
      note: "12 / 2 = 6 bytes."
    },
    {
      id: "u13-8-bytes-nibbles", category: "u13-convert",
      prompt: "8 bytes = how many nibbles?",
      answers: ["16 nibbles"],
      keywords: [/^\s*16\s*(nibbles?)?\s*$/i],
      distractors: ["4 nibbles", "32 nibbles", "64 nibbles", "2 nibbles"],
      note: "8 x 2 = 16 nibbles. From 0478/12 March 2023 Question 3(a)."
    },
    {
      id: "u13-kib-bits", category: "u13-multi",
      prompt: "How many bits are there in a kibibyte (KiB)?",
      answers: ["8192 bits"],
      keywords: [/^\s*8[,\s]?192\s*(bits?)?\s*$/i],
      distractors: ["1024 bits", "8000 bits", "1000 bits", "128 bits", "2048 bits"],
      note: "1 KiB = 1024 bytes, and 1024 x 8 = 8192 bits. From 0478/12 June 2024 Question 1(b)."
    },
    {
      id: "u13-2-kib-bits", category: "u13-multi",
      prompt: "Convert 2 KiB to bits.",
      answers: ["16384 bits"],
      keywords: [/^\s*16[,\s]?384\s*(bits?)?\s*$/i],
      distractors: ["2048 bits", "16000 bits", "256 bits", "8192 bits", "4096 bits"],
      note: "2 x 1024 = 2048 bytes, and 2048 x 8 = 16,384 bits."
    },
    {
      id: "u13-24576-bits-kib", category: "u13-multi",
      prompt: "Convert 24576 bits to KiB.",
      answers: ["3 KiB"],
      keywords: [/^\s*3\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["24 KiB", "3072 KiB", "24.576 KiB", "12 KiB", "6 KiB"],
      note: "24,576 / 8 = 3072 bytes, and 3072 / 1024 = 3 KiB."
    },
    {
      id: "u13-1-gib-kib", category: "u13-multi",
      prompt: "Convert 1 GiB to KiB.",
      answers: ["1048576 KiB"],
      keywords: [/^\s*1[,\s]?048[,\s]?576\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["1024 KiB", "1000000 KiB", "2048 KiB", "8192 KiB", "1073741824 KiB"],
      note: "1 GiB = 1024 MiB, and 1024 x 1024 = 1,048,576 KiB."
    },
    {
      id: "u13-3-mib-bytes", category: "u13-multi",
      prompt: "Convert 3 MiB to bytes.",
      answers: ["3145728 bytes"],
      keywords: [/^\s*3[,\s]?145[,\s]?728\s*(bytes?|b)?\s*$/i],
      distractors: ["3072 bytes", "3000000 bytes", "25165824 bytes", "393216 bytes", "3145728000 bytes"],
      note: "3 x 1024 = 3072 KiB, and 3072 x 1024 = 3,145,728 bytes."
    },
    {
      id: "u13-eib-tib", category: "u13-multi",
      prompt: "One exbibyte (EiB) equals 1024 x 1024 of which unit?",
      answers: ["Tebibytes (TiB)"],
      keywords: [/^\s*(tebibytes?|tib)(\s*\(tib\))?\s*$/i],
      distractors: ["Gibibytes (GiB)", "Pebibytes (PiB)", "Mebibytes (MiB)", "Kibibytes (KiB)"],
      note: "EiB to PiB is x1024, PiB to TiB is x1024 again. From 0478/12 March 2026 Question 1(a)."
    }
  ]
});
