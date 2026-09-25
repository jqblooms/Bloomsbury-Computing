// Year 10, 1.3 Data Storage and Compression - Exam Questions
// Loaded by Drills/index.html?drill=examqs-y10-1-3
DrillData.register("examqs-y10-1-3", {
  title: "Year 10, 1.3 Data Storage and Compression - Exam Questions",
  subtitle: "Cambridge IGCSE Computer Science 0478 - past-paper questions and exam-style practice",
  isExamSet: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["x13-units", "Storage Units"],
    ["x13-filesize", "File Size"],
    ["x13-compression", "Compression"]
  ],
  cards: [
    {
      id: "y10-1-3-units-1", category: "x13-units",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 11, Question 1(a)",
      marks: 1,
      stem: "Which is the smallest data storage unit? A byte, B gibibyte (GiB), C kibibyte (KiB), D nibble.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "D", acceptedAnswers: ["Nibble"] }
      ]
    },
    {
      id: "y10-1-3-units-2", category: "x13-units",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 11, Question 1(b)",
      marks: 1,
      stem: "State how many tebibytes (TiB) are equal to 2 pebibytes (PiB).",
      parts: [
        { label: "Enter the number of TiB.", correctAnswer: "2048", acceptedAnswers: ["2,048", "2048 TiB", "2048TiB"] }
      ]
    },
    {
      id: "y10-1-3-units-3", category: "x13-units",
      source: "Cambridge IGCSE 0478, February/March 2023 Paper 12, Question 3(a)",
      marks: 4,
      stem: "Data storage is measured using binary denominations. Complete each conversion.",
      parts: [
        { label: "8 bytes = ... nibbles", correctAnswer: "16" },
        { label: "512 kibibytes (KiB) = ... mebibytes (MiB)", correctAnswer: "0.5", acceptedAnswers: [".5", "1/2"] },
        { label: "4 gibibytes (GiB) = ... mebibytes (MiB)", correctAnswer: "4096", acceptedAnswers: ["4,096"] },
        { label: "1 exbibyte (EiB) = ... pebibytes (PiB)", correctAnswer: "1024", acceptedAnswers: ["1,024"] }
      ]
    },
    {
      id: "y10-1-3-units-4", category: "x13-units",
      source: "Cambridge IGCSE 0478, May/June 2024 Paper 12, Question 1(a)-(c)",
      marks: 3,
      stem: "Data can be measured in bits.",
      parts: [
        { label: "Give the name of the data storage measurement that is equal to 8 bits.", correctAnswer: "Byte", acceptedAnswers: ["Bytes", "1 byte", "A byte"] },
        { label: "State how many bits there are in a kibibyte (KiB).", correctAnswer: "8192", acceptedAnswers: ["8,192", "8192 bits"] },
        { label: "Give the name of the data storage measurement that is equal to 1024 gibibytes (GiB).", correctAnswer: "Tebibyte", acceptedAnswers: ["TiB", "Tebibyte (TiB)", "Tebibytes", "1 TiB"] }
      ]
    },
    {
      id: "y10-1-3-units-5", category: "x13-units",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 12, Question 2(b)",
      marks: 2,
      stem: "The size of an image file is 3072 bytes.",
      parts: [
        { label: "Give the size of the image file in kibibytes (KiB).", correctAnswer: "3", acceptedAnswers: ["3 KiB", "3KiB"] },
        { label: "State the number of nibbles in 1 byte.", correctAnswer: "2", acceptedAnswers: ["2 nibbles", "Two"] }
      ]
    },
    {
      id: "y10-1-3-units-6", category: "x13-units",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 1(a)",
      marks: 1,
      stem: "Which statement about data storage is correct? A One bit equals four nibbles. B One byte equals 16 bits. C One exbibyte (EiB) equals 1024 x 1024 tebibytes (TiB). D One mebibyte (MiB) equals 1024 x 1024 gibibytes (GiB).",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "C" }
      ]
    },
    {
      id: "y10-1-3-size-1", category: "x13-filesize",
      source: "Cambridge IGCSE 0478, May/June 2024 Paper 12, Question 1(d)",
      marks: 1,
      stem: "A 16-bit colour image has a resolution of 512 pixels wide by 512 pixels high. Calculate the file size of the image in kibibytes (KiB).",
      parts: [
        { label: "Enter the file size in KiB.", correctAnswer: "512", acceptedAnswers: ["512 KiB", "512KiB"] }
      ]
    },
    {
      id: "y10-1-3-size-2", category: "x13-filesize",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 1(b)",
      marks: 1,
      stem: "An image file has a resolution of 1024 pixels high x 1024 pixels wide. The colour depth is two bytes. Calculate the file size of the image in MiB.",
      parts: [
        { label: "Enter the file size in MiB.", correctAnswer: "2", acceptedAnswers: ["2 MiB", "2MiB"] }
      ]
    },
    {
      id: "y10-1-3-size-3", category: "x13-filesize",
      source: "Exam-style question, adapted from Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 1(b) using a sound file",
      marks: 2,
      stem: "A sound file has a sample rate of 8192 samples per second and a sample resolution of 16 bits. The track is 64 seconds long.",
      parts: [
        { label: "Calculate the file size in KiB.", correctAnswer: "1024", acceptedAnswers: ["1,024", "1024 KiB", "1024KiB"] },
        { label: "Give the same file size in MiB.", correctAnswer: "1", acceptedAnswers: ["1 MiB", "1MiB"] }
      ]
    },
    {
      id: "y10-1-3-size-4", category: "x13-filesize",
      source: "Exam-style question, adapted from Cambridge IGCSE 0478, May/June 2022 Paper 11, Question 5 using a sound file",
      marks: 1,
      stem: "A sound file has a sample rate of 1000 samples per second and a sample resolution of 8 bits. The track is 10 seconds long. Calculate the file size of the sound file in bytes.",
      parts: [
        { label: "Enter the file size in bytes.", correctAnswer: "10000", acceptedAnswers: ["10,000", "10000 bytes"] }
      ]
    },
    {
      id: "y10-1-3-comp-1", category: "x13-compression",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 11, Question 1(c)(i)",
      marks: 1,
      stem: "The size of a file needs to be reduced. Give the name of the process that is used to reduce the size of a file.",
      parts: [
        { label: "Enter the name of the process.", correctAnswer: "Compression", acceptedAnswers: ["Data compression", "Compressing"] }
      ]
    },
    {
      id: "y10-1-3-comp-2", category: "x13-compression",
      source: "Cambridge IGCSE 0478, May/June 2022 Paper 11, Question 1(a)(ii)",
      marks: 1,
      stem: "Jack has an MP3 file stored on his computer. Is the MP3 file A a lossy compressed file, B a lossless compressed file or C not a compressed file?",
      parts: [
        { label: "Enter A, B or C.", correctAnswer: "A", acceptedAnswers: ["Lossy", "Lossy compressed file"] }
      ]
    },
    {
      id: "y10-1-3-comp-3", category: "x13-compression",
      source: "Cambridge IGCSE 0478, May/June 2022 Paper 13, Question 6(b)",
      marks: 1,
      stem: "Frida has a JPEG file stored on her computer. Is the JPEG file A a lossy compressed file, B a lossless compressed file or C not a compressed file?",
      parts: [
        { label: "Enter A, B or C.", correctAnswer: "A", acceptedAnswers: ["Lossy", "Lossy compressed file"] }
      ]
    },
    {
      id: "y10-1-3-comp-4", category: "x13-compression",
      source: "Cambridge IGCSE 0478, May/June 2022 Paper 13, Question 6(d)",
      marks: 1,
      stem: "Frida compresses a document for storage. The compression algorithm recognises repeating patterns in the data and indexes these patterns. No data is permanently removed. Identify the type of compression Frida has used.",
      parts: [
        { label: "Enter the type of compression.", correctAnswer: "Lossless", acceptedAnswers: ["Lossless compression"] }
      ]
    },
    {
      id: "y10-1-3-comp-5", category: "x13-compression",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 13, Question 1(c)(iii)",
      marks: 1,
      stem: "A computer uses the ASCII character set for a text file. The text file needs to be compressed. Identify the most appropriate type of compression for the text file.",
      parts: [
        { label: "Enter the compression type.", correctAnswer: "Lossless", acceptedAnswers: ["Lossless compression"] }
      ]
    },
    {
      id: "y10-1-3-comp-6", category: "x13-compression",
      source: "Exam-style question, based on the 1.3 syllabus example of a lossless method",
      marks: 1,
      stem: "Identify one lossless method of compressing an image.",
      parts: [
        { label: "Enter the method.", correctAnswer: "Run length encoding", acceptedAnswers: ["RLE", "Run-length encoding", "Run length encoding (RLE)", "Run-length encoding (RLE)"] }
      ]
    }
  ]
});
