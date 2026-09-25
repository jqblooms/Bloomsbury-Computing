// Year 10, 1.3 L2: File Size Calculations
// Loaded by Drills/index.html?drill=y10-1-3-l2-filesize
DrillData.register("y10-1-3-l2-filesize", {
  title: "Year 10, 1.3 L2: File Size Calculations",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["u13-method", "Method and Units"],
    ["u13-image", "Image File Size"],
    ["u13-sound", "Sound File Size"]
  ],
  cards: [
    {
      id: "u13-image-formula", category: "u13-method",
      prompt: "Describe how to calculate the file size of an image in bits.",
      answers: ["Multiply the width by the height by the colour depth"],
      keywords: [{ required: [["multiply", "multiplied", "times", "x"], ["width", "resolution"], ["colour", "color", "bit"]], excluded: ["add", "divide", "sample"] },
                 { required: [["resolution", "pixel"], ["colour", "color"], ["depth"]], excluded: ["add", "divide", "sample"] }],
      distractors: ["Add the width, the height and the colour depth", "Multiply the sample rate by the sample resolution", "Divide the width by the colour depth", "Multiply the width by the height only"],
      note: "Image file size in bits = width x height x colour depth."
    },
    {
      id: "u13-sound-formula", category: "u13-method",
      prompt: "Describe how to calculate the file size of a sound file in bits.",
      answers: ["Multiply the sample rate by the sample resolution by the length of the track in seconds"],
      keywords: [{ required: [["rate"], ["resolution"], ["length", "second", "duration", "time"]], excluded: ["add", "divide", "colour", "color"] }],
      distractors: ["Multiply the sample rate by the sample resolution only", "Add the sample rate to the length of the track", "Multiply the width by the height by the colour depth", "Divide the sample rate by the length of the track"],
      note: "Sound file size in bits = sample rate x sample resolution x length in seconds."
    },
    {
      id: "u13-bits-to-bytes", category: "u13-method",
      prompt: "A file size has been worked out in bits. What do you divide by to get bytes?",
      answers: ["8"],
      keywords: [/^\s*(by\s+)?8\s*$/i],
      distractors: ["1024", "4", "1000", "16"],
      note: "There are 8 bits in a byte, so divide the bits by 8."
    },
    {
      id: "u13-depth-in-bytes", category: "u13-method",
      prompt: "An image's colour depth is given in bytes. Do you still divide by 8 to get the file size in bytes?",
      answers: ["No"],
      keywords: [{ required: [["no"]] }],
      distractors: ["Yes, always divide by 8", "Yes, then divide by 1024 too", "Only if the image is black and white"],
      note: "Width x height x colour depth in bytes already gives bytes. Dividing by 8 again would be wrong."
    },
    {
      id: "u13-minutes", category: "u13-method",
      prompt: "A track length is given in minutes. What must you do to it before using the sound formula?",
      answers: ["Convert it to seconds (multiply by 60)"],
      keywords: [{ required: [["second", "60"]] }],
      distractors: ["Divide it by 8", "Multiply it by 1024", "Nothing, use the minutes directly"],
      note: "Sample rate is samples per second, so the length must be in seconds: multiply minutes by 60."
    },
    {
      id: "u13-img-100x150", category: "u13-image",
      prompt: "An image is 16-bit colour, 100 pixels high and 150 pixels wide. Calculate its file size in bytes.",
      answers: ["30000 bytes"],
      keywords: [/^\s*30[,\s]?000\s*(bytes?|b)?\s*$/i],
      distractors: ["240000 bytes", "15000 bytes", "3750 bytes", "29.3 bytes", "1875 bytes"],
      note: "100 x 150 = 15,000 pixels, x 16 = 240,000 bits, / 8 = 30,000 bytes. 0478/11 June 2022 Question 5."
    },
    {
      id: "u13-img-1000-2b", category: "u13-image",
      prompt: "An image has a resolution of 1000 x 1000 and a colour depth of 2 bytes. Calculate its file size in bytes.",
      answers: ["2000000 bytes"],
      keywords: [/^\s*2[,\s]?000[,\s]?000\s*(bytes?|b)?\s*$/i],
      distractors: ["250000 bytes", "16000000 bytes", "1000000 bytes", "2000 bytes", "1953 bytes"],
      note: "1000 x 1000 x 2 = 2,000,000 bytes. No divide by 8. 0478/12 March 2023 Question 4(b)."
    },
    {
      id: "u13-img-512-256", category: "u13-image",
      prompt: "An image is 512 pixels wide and 256 pixels high with an 8-bit colour depth. Calculate its file size in KiB.",
      answers: ["128 KiB"],
      keywords: [/^\s*128\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["1024 KiB", "131072 KiB", "16 KiB", "256 KiB", "131 KiB"],
      note: "512 x 256 x 8 = 1,048,576 bits, / 8 = 131,072 bytes, / 1024 = 128 KiB."
    },
    {
      id: "u13-img-64x32", category: "u13-image",
      prompt: "An image is 64 x 32 pixels with an 8-bit colour depth. Calculate its file size in bytes.",
      answers: ["2048 bytes"],
      keywords: [/^\s*2[,\s]?048\s*(bytes?|b)?\s*$/i],
      distractors: ["16384 bytes", "256 bytes", "2 bytes", "96 bytes", "4096 bytes"],
      note: "64 x 32 x 8 = 16,384 bits, / 8 = 2048 bytes."
    },
    {
      id: "u13-img-2048x1024-3b", category: "u13-image",
      prompt: "An image is 2048 x 1024 pixels with a colour depth of 3 bytes. Calculate its file size in MiB.",
      answers: ["6 MiB"],
      keywords: [/^\s*6\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["2 MiB", "48 MiB", "6144 MiB", "3 MiB", "0.75 MiB"],
      note: "2048 x 1024 x 3 = 6,291,456 bytes, / 1024 / 1024 = 6 MiB."
    },
    {
      id: "u13-img-1024-2b-mib", category: "u13-image",
      prompt: "An image is 1024 x 1024 pixels with a colour depth of two bytes. Calculate its file size in MiB.",
      answers: ["2 MiB"],
      keywords: [/^\s*2\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["16 MiB", "1 MiB", "2048 MiB", "0.25 MiB", "4 MiB"],
      note: "1024 x 1024 x 2 = 2,097,152 bytes = 2 MiB. 0478/12 March 2026 Question 1(b)."
    },
    {
      id: "u13-snd-8192-8-10", category: "u13-sound",
      prompt: "A sound has a sample rate of 8192 samples per second, an 8-bit sample resolution and lasts 10 seconds. Calculate its file size in KiB.",
      answers: ["80 KiB"],
      keywords: [/^\s*80\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["640 KiB", "81920 KiB", "8 KiB", "10 KiB", "655 KiB"],
      note: "8192 x 8 x 10 = 655,360 bits, / 8 = 81,920 bytes, / 1024 = 80 KiB."
    },
    {
      id: "u13-snd-8192-16-64-kib", category: "u13-sound",
      prompt: "A sound has a sample rate of 8192 samples per second, a 16-bit sample resolution and lasts 64 seconds. Calculate its file size in KiB.",
      answers: ["1024 KiB"],
      keywords: [/^\s*1[,\s]?024\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["8192 KiB", "1 KiB", "128 KiB", "1048576 KiB", "2048 KiB"],
      note: "8192 x 16 x 64 = 8,388,608 bits, / 8 = 1,048,576 bytes, / 1024 = 1024 KiB."
    },
    {
      id: "u13-snd-8192-16-64-mib", category: "u13-sound",
      prompt: "The same sound file is 1024 KiB. Give its size in MiB.",
      answers: ["1 MiB"],
      keywords: [/^\s*1\s*(mib|mebibytes?)?\s*$/i],
      distractors: ["1024 MiB", "8 MiB", "0.5 MiB", "1.024 MiB"],
      note: "1024 KiB / 1024 = 1 MiB."
    },
    {
      id: "u13-snd-1000-8-10", category: "u13-sound",
      prompt: "A sound has a sample rate of 1000 samples per second, an 8-bit sample resolution and lasts 10 seconds. Calculate its file size in bytes.",
      answers: ["10000 bytes"],
      keywords: [/^\s*10[,\s]?000\s*(bytes?|b)?\s*$/i],
      distractors: ["80000 bytes", "1000 bytes", "8000 bytes", "9.8 bytes", "100000 bytes"],
      note: "1000 x 8 x 10 = 80,000 bits, / 8 = 10,000 bytes."
    },
    {
      id: "u13-snd-20-8-4", category: "u13-sound",
      prompt: "A recording lasts 4 seconds, sampled at 20 samples per second with an 8-bit sample resolution. Calculate its file size in bytes.",
      answers: ["80 bytes"],
      keywords: [/^\s*80\s*(bytes?|b)?\s*$/i],
      distractors: ["640 bytes", "160 bytes", "32 bytes", "20 bytes"],
      note: "20 x 8 x 4 = 640 bits, / 8 = 80 bytes."
    },
    {
      id: "u13-snd-minute", category: "u13-sound",
      prompt: "A sound has a sample rate of 1024 samples per second, an 8-bit sample resolution and lasts 1 minute. Calculate its file size in KiB.",
      answers: ["60 KiB"],
      keywords: [/^\s*60\s*(kib|kibibytes?)?\s*$/i],
      distractors: ["1 KiB", "480 KiB", "61440 KiB", "8 KiB", "7.5 KiB"],
      note: "1024 x 8 x 60 = 491,520 bits, / 8 = 61,440 bytes, / 1024 = 60 KiB."
    },
    {
      id: "u13-snd-bigger", category: "u13-sound",
      prompt: "The sample resolution of a recording is doubled. What happens to its file size?",
      answers: ["It doubles"],
      keywords: [{ required: [["double", "doubles", "doubled", "twice", "2"]], excluded: ["half", "halve", "halves", "same"] }],
      distractors: ["It halves", "It stays the same", "It quadruples", "It goes up by 8 bits"],
      note: "Sample resolution is multiplied into the file size, so doubling it doubles the file size."
    }
  ]
});
