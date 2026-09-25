// Year 10, 1.3 L3: Compression
// Loaded by Drills/index.html?drill=y10-1-3-l3-compression
DrillData.register("y10-1-3-l3-compression", {
  title: "Year 10, 1.3 L3: Compression",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["u13-why", "Why Compress"],
    ["u13-lossy", "Lossy Compression"],
    ["u13-lossless", "Lossless Compression and RLE"]
  ],
  cards: [
    {
      id: "u13-compress-name", category: "u13-why",
      prompt: "Give the name of the process used to reduce the size of a file.",
      answers: ["Compression"],
      keywords: [/^\s*(data\s+)?compress(ion|ing)?\s*$/i],
      distractors: ["Encryption", "Validation", "Decompression", "Verification"],
      note: "Compression reduces the size of a file. 0478/11 June 2025 Question 1(c)(i)."
    },
    {
      id: "u13-effect-storage", category: "u13-why",
      prompt: "A file is compressed. What effect does this have on the storage space it needs?",
      answers: ["Less storage space is needed"],
      keywords: [{ required: [["less", "reduce", "reduced", "reduces", "smaller", "lower", "fewer"]], excluded: ["more", "increase", "increases", "same"] }],
      distractors: ["More storage space is needed", "The storage space stays the same", "It needs a different type of storage"],
      note: "A smaller file takes up less storage space."
    },
    {
      id: "u13-effect-bandwidth", category: "u13-why",
      prompt: "A compressed file is sent across a network. What effect does compression have on the bandwidth needed?",
      answers: ["Less bandwidth is needed"],
      keywords: [{ required: [["less", "reduce", "reduced", "reduces", "lower", "smaller"]], excluded: ["more", "increase", "increases", "same"] }],
      distractors: ["More bandwidth is needed", "The bandwidth stays the same", "The network gets faster for everyone"],
      note: "Less data has to be sent, so less bandwidth is required."
    },
    {
      id: "u13-effect-time", category: "u13-why",
      prompt: "What effect does compressing a file have on the time taken to transmit it?",
      answers: ["The transmission time is shorter"],
      keywords: [{ required: [["shorter", "less", "faster", "quicker", "reduce", "reduced", "reduces", "lower"]], excluded: ["longer", "more", "slower", "increase", "increases", "same"] }],
      distractors: ["The transmission time is longer", "The transmission time is the same", "The file cannot be transmitted"],
      note: "A smaller file takes less time to upload, download or email."
    },
    {
      id: "u13-other-reason", category: "u13-why",
      prompt: "One reason to reduce a file's size is a shorter transmission time. Give one other reason.",
      answers: ["Less storage space is needed", "Less bandwidth is needed"],
      keywords: [{ required: [["storage", "space", "bandwidth", "memory"]] }],
      distractors: ["It sends the file faster", "It makes the file more secure", "It improves the quality of the file", "It changes the file type"],
      note: "Less storage space, or less bandwidth. 0478/11 June 2025 Question 1(c)(ii)."
    },
    {
      id: "u13-lossy-def", category: "u13-lossy",
      prompt: "How does lossy compression reduce the size of a file?",
      answers: ["By permanently removing data"],
      keywords: [{ required: [["remove", "removed", "removing", "delete", "deleted", "discard", "discarded", "lose", "lost"]], excluded: ["no", "nothing", "without", "not"] }],
      distractors: ["By storing repeated data as a count and a value", "By converting it to hexadecimal", "By encrypting it", "By removing nothing at all"],
      note: "Lossy compression permanently removes data, which can never be put back."
    },
    {
      id: "u13-lossy-image-res", category: "u13-lossy",
      prompt: "Give one way lossy compression can reduce the size of an image file.",
      answers: ["Reduce the resolution", "Reduce the colour depth"],
      keywords: [{ required: [["reduce", "reduced", "reducing", "lower", "lowered", "lowering", "decrease", "decreased", "decreasing", "fewer", "less"], ["resolution", "colour", "color", "depth", "pixel"]], excluded: ["increase", "increases", "more", "count", "encrypt"] }],
      distractors: ["Store runs of pixels as a count", "Increase the resolution", "Increase the colour depth", "Encrypt the pixels"],
      note: "Reducing the resolution (fewer pixels) or the colour depth (fewer bits per pixel) permanently removes data."
    },
    {
      id: "u13-lossy-sound", category: "u13-lossy",
      prompt: "Give one way lossy compression can reduce the size of a sound file.",
      answers: ["Reduce the sample rate", "Reduce the sample resolution"],
      keywords: [{ required: [["reduce", "reduced", "reducing", "lower", "lowered", "lowering", "decrease", "decreased", "decreasing", "fewer", "less"], ["rate", "resolution", "sample"]], excluded: ["increase", "increases", "more", "count", "longer"] }],
      distractors: ["Store repeated samples as a count", "Increase the sample rate", "Make the track longer", "Convert it to text"],
      note: "Reducing the sample rate or the sample resolution permanently removes data."
    },
    {
      id: "u13-lossy-res-type", category: "u13-lossy",
      prompt: "Is reducing the resolution of an image lossy or lossless?",
      answers: ["Lossy"],
      keywords: [/^\s*lossy(\s+compression)?\s*$/i],
      distractors: ["Lossless"],
      note: "The removed pixels are gone for good, so it is lossy."
    },
    {
      id: "u13-lossy-depth-quarter", category: "u13-lossy",
      prompt: "An image has its colour depth reduced from 24 bits to 8 bits. How many times smaller is the image data?",
      answers: ["3 times"],
      keywords: [/^\s*3(\s*times)?\s*$/i],
      distractors: ["16 times", "8 times", "2 times", "24 times"],
      note: "File size is proportional to colour depth: 24 / 8 = 3 times smaller."
    },
    {
      id: "u13-lossy-halve-rate", category: "u13-lossy",
      prompt: "A 4 MiB sound file has its sample rate halved. Give the new file size in MiB.",
      answers: ["2 MiB"],
      keywords: [/^\s*2\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["4 MiB", "8 MiB", "1 MiB", "3 MiB"],
      note: "Sample rate is multiplied into the file size, so halving it halves the file: 2 MiB."
    },
    {
      id: "u13-mp3", category: "u13-lossy",
      prompt: "Is an MP3 file a lossy compressed file, a lossless compressed file, or not compressed?",
      answers: ["Lossy compressed file"],
      keywords: [/^\s*lossy(\s+compress(ed|ion))?(\s+file)?\s*$/i],
      distractors: ["Lossless compressed file", "Not a compressed file"],
      note: "MP3 is lossy. 0478/11 June 2022 Question 1(a)(ii)."
    },
    {
      id: "u13-lossless-def", category: "u13-lossless",
      prompt: "How is lossless compression different from lossy compression?",
      answers: ["No data is permanently removed, so the original can be rebuilt exactly"],
      keywords: [{ required: [["exact", "exactly", "original", "identical"]], excluded: ["lossy"] },
                 { required: [["no", "nothing", "without"], ["data", "loss", "lost", "remove", "removed"]] }],
      distractors: ["It removes data the user will not notice", "It always makes a file smaller than lossy does", "It only works on sound files", "It reduces the colour depth"],
      note: "Lossless reduces file size without permanent loss of data. The original is rebuilt exactly."
    },
    {
      id: "u13-rle-name", category: "u13-lossless",
      prompt: "Name the lossless method that stores each run of repeated data as a count and a value.",
      answers: ["Run length encoding (RLE)"],
      keywords: [/^\s*(rle|run[\s-]*length[\s-]*encoding(\s*\(?rle\)?)?)\s*$/i],
      distractors: ["Lossy compression", "Encryption", "Hexadecimal", "Parity check"],
      note: "Run length encoding (RLE) is the lossless method named in the syllabus."
    },
    {
      id: "u13-rle-text", category: "u13-lossless",
      prompt: "Encode the text AAAAABBBCCCC using RLE.",
      answers: ["5A 3B 4C"],
      keywords: [/^\s*5\s*A[\s,]*3\s*B[\s,]*4\s*C\s*$/i],
      distractors: ["A5 B3 C4", "5 3 4", "ABC", "12ABC"],
      note: "Five A, then three B, then four C: 5A 3B 4C."
    },
    {
      id: "u13-rle-row", category: "u13-lossless",
      prompt: "Encode the pixel row BBWWWWWWBB using RLE.",
      answers: ["2B 6W 2B"],
      keywords: [/^\s*2\s*B[\s,]*6\s*W[\s,]*2\s*B\s*$/i],
      distractors: ["4B 6W", "2B 6W", "B2 W6 B2", "10BW"],
      note: "2 black, 6 white, 2 black: 2B 6W 2B."
    },
    {
      id: "u13-rle-decode", category: "u13-lossless",
      prompt: "The RLE row 3W 2B 4W is decoded. How many pixels does it have?",
      answers: ["9 pixels"],
      keywords: [/^\s*9\s*(pixels?)?\s*$/i],
      distractors: ["3 pixels", "6 pixels", "24 pixels", "5 pixels"],
      note: "3 + 2 + 4 = 9 pixels."
    },
    {
      id: "u13-text-type", category: "u13-lossless",
      prompt: "A text file needs to be compressed. Which type of compression is most appropriate?",
      answers: ["Lossless"],
      keywords: [/^\s*lossless(\s+compression)?\s*$/i],
      distractors: ["Lossy"],
      note: "Lossless: removing characters would change what the text says. 0478/13 June 2026 Question 1(c)(iii)."
    },
    {
      id: "u13-patterns-indexed", category: "u13-lossless",
      prompt: "A compression algorithm indexes repeating patterns in the data. No data is permanently removed. Which type of compression is it?",
      answers: ["Lossless"],
      keywords: [/^\s*lossless(\s+compression)?\s*$/i],
      distractors: ["Lossy"],
      note: "No permanent loss of data means lossless. 0478/13 June 2022 Question 6(d)."
    }
  ]
});
