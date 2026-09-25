// Year 10, 1.2 L5: Compression
// Loaded by Drills/index.html?drill=y10-1-2-l5-compression
DrillData.register("y10-1-2-l5-compression", {
  title: "Year 10, 1.2 L5: Compression",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["fscomp-concept", "Lossless vs Lossy"],
    ["fscomp-rle", "Run-Length Encoding"],
    ["fscomp-choose", "Choosing a Method"]
  ],
  cards: [
    {
      id: "comp-lossless-def", category: "fscomp-concept",
      prompt: "What is lossless compression?",
      answers: ["Compression where the file can be decompressed back to an exact copy of the original"],
      keywords: [{ required: [["exact"], ["original", "copy"]], excluded: ["remove", "removed", "loses", "lost"] }],
      distractors: ["Compression that removes some of the original data permanently", "Compression that only works on image files", "Compression that always makes a file at least half the size", "Compression that removes every repeated character in a file"],
      hint: "Decompresses back to an exact copy",
      note: "Nothing is thrown away - the original data is only stored more efficiently."
    },
    {
      id: "comp-lossy-def", category: "fscomp-concept",
      prompt: "What is lossy compression?",
      answers: ["Compression that permanently removes some of the original data, chosen because it is least noticeable"],
      keywords: [{ required: [["remove", "removed", "removes", "discard", "discarded"]], excluded: ["exact", "nothing"] }],
      distractors: ["Compression that can always be reversed with no data lost", "Compression that only ever works on sound files", "Compression that makes a copy of the file for backup", "Compression that stores every pixel using fewer colours only"],
      hint: "Permanently removes some data",
      note: "The removed data cannot be recovered - the original can never be perfectly restored."
    },
    {
      id: "comp-why-compress", category: "fscomp-concept",
      prompt: "Give one reason a file might be compressed.",
      answers: ["So it takes up less storage space", "So it travels faster over a network"],
      keywords: [{ required: [["storage", "space", "network", "faster", "smaller", "size"]] }],
      distractors: ["So the file can never be opened by anyone else", "So the file's content changes to something new", "So the file always becomes a different file type", "So the file can only be viewed once"],
      hint: "Less storage, or faster to send",
      note: "Compression makes a file smaller without changing what it actually contains."
    },
    {
      id: "comp-lossless-restore", category: "fscomp-concept",
      prompt: "Can a lossy-compressed file be restored to an exact copy of the original once compressed?",
      answers: ["No, some data has been permanently removed"],
      keywords: [{ required: [["no"]] }],
      distractors: ["Yes, decompressing always restores it exactly", "Yes, but only if the file is an image", "Only if the file is decompressed twice", "Yes, as long as enough storage is available"],
      hint: "No",
      note: "That permanent loss is exactly what makes it 'lossy'."
    },
    {
      id: "comp-why-lossless-poster", category: "fscomp-concept",
      prompt: "An artist compresses an image before printing it as a large poster. Why choose lossless rather than lossy compression?",
      answers: ["Any loss of detail from lossy compression would be clearly visible on a large printed poster"],
      keywords: [{ required: [["visible", "noticeable", "detail", "quality"]] }],
      distractors: ["Lossless compression always produces a smaller file than lossy", "Lossy compression cannot be used on image files at all", "Lossless compression is required for every file uploaded to a website", "Posters cannot be printed from a lossy-compressed file"],
      hint: "Detail loss would show on a large poster",
      note: "A printed poster shows detail lossy compression would remove - the trade-off is not worth it here."
    },
    {
      id: "comp-why-lossy-video", category: "fscomp-concept",
      prompt: "A website streams video using lossy compression. Give one reason the quality loss is an acceptable trade-off here.",
      answers: ["The small drop in quality is hard for a viewer to notice while the video plays"],
      keywords: [{ required: [["notice", "noticeable"]], excluded: ["allowed"] }],
      distractors: ["Video files never contain any data worth keeping", "The lost data is automatically restored when the video is downloaded", "Lossless compression cannot be applied to video at all", "Viewers are not allowed to notice the drop in quality"],
      hint: "Hard for a viewer to notice",
      note: "Lossy compression removes detail judged least noticeable - a small quality drop most viewers will not spot."
    },
    {
      id: "comp-rle-name", category: "fscomp-rle",
      prompt: "What does the abbreviation RLE stand for?",
      answers: ["Run-length encoding"],
      keywords: [/run.?length.?encod/i],
      distractors: ["Random length encoding", "Repeated line encryption", "Real-length extraction", "Run-limit exchange"],
      hint: "Run-length encoding",
      note: "RLE is a lossless compression method."
    },
    {
      id: "comp-rle-lossless-or-lossy", category: "fscomp-rle",
      prompt: "Is run-length encoding (RLE) a lossless or a lossy method?",
      answers: ["Lossless"],
      keywords: [{ required: [["lossless"]], excluded: ["lossy"] }],
      distractors: ["Lossy", "Neither - it does not actually compress anything", "Both, depending on the file type", "It removes data, so it must be lossy"],
      hint: "Lossless",
      note: "RLE only stores runs more efficiently - decoding rebuilds the exact original pixels."
    },
    {
      id: "comp-rle-stores", category: "fscomp-rle",
      prompt: "Instead of storing every pixel individually, what does RLE store for each unbroken run of the same colour?",
      answers: ["A (count, colour) pair - how many pixels, and which colour"],
      keywords: [{ required: [["count", "number"], ["colour", "color", "value"]] }],
      distractors: ["A single average colour for the whole image", "The exact binary code for every individual pixel", "A list of every colour used, in alphabetical order", "The position of the pixel and nothing else"],
      hint: "A count and a colour, per run",
      note: "Example: 5 white pixels in a row becomes one pair, (5, white), instead of five separate values."
    },
    {
      id: "comp-rle-helps-when", category: "fscomp-rle",
      prompt: "When does RLE compress an image well?",
      answers: ["When there are long runs of the same colour repeated in a row"],
      keywords: [{ required: [["run", "runs", "repeat", "repeated", "same"]] }],
      distractors: ["When every pixel is a different colour from its neighbours", "When the image uses the maximum possible colour depth", "When the image has been resized to be smaller", "When the image contains no colour at all"],
      hint: "Long runs of the same colour",
      note: "A flag or logo with large flat blocks of colour is the ideal case for RLE."
    },
    {
      id: "comp-rle-hurts-when", category: "fscomp-rle",
      prompt: "Why can RLE sometimes make a file LARGER instead of smaller?",
      answers: ["If colours alternate every pixel, RLE ends up storing a count for every single pixel, which is more data than the original"],
      keywords: [{ required: [["alternate", "alternating", "short", "random"]] }],
      distractors: ["RLE always makes every file exactly the same size", "RLE only works correctly on sound files, not images", "RLE removes colours, which uses more storage per pixel", "A file compressed with RLE can never be decompressed again"],
      hint: "Colours alternating every pixel",
      note: "A run of length 1 still needs a (count, colour) pair stored - worse than just storing the one pixel."
    },
    {
      id: "comp-rle-count-wwwwwbbbbb", category: "fscomp-rle",
      prompt: "A 10-pixel row is WWWWWBBBBB (5 white, then 5 black). How many (count, colour) pairs does RLE need to encode it?",
      answers: ["2"],
      keywords: [{ required: [["2"]], excluded: ["10", "5"] }],
      distractors: ["10", "5", "1", "20"],
      hint: "2",
      note: "One run of white, one run of black - two runs, two pairs."
    },
    {
      id: "comp-rle-decode-pixels", category: "fscomp-rle",
      prompt: "The RLE encoding 4W 4B 4W 4B 4W is decoded. How many pixels does this represent in total?",
      answers: ["20"],
      keywords: [{ required: [["20"]], excluded: ["5", "4"] }],
      distractors: ["5", "4", "16", "24"],
      hint: "20",
      note: "Add up every count: 4 + 4 + 4 + 4 + 4 = 20 pixels."
    },
    {
      id: "comp-choose-poster", category: "fscomp-choose",
      prompt: "An image will be printed as a large, detailed poster where every detail matters. Which compression method should be used?",
      answers: ["Lossless compression"],
      keywords: [{ required: [["lossless"]], excluded: ["lossy"] }],
      distractors: ["Lossy compression", "No compression should ever be used", "RLE, but only in lossy mode", "Whichever method gives the smallest file, regardless of quality"],
      hint: "Lossless",
      note: "Detail lost by lossy compression would be clearly visible on a large printed poster."
    },
    {
      id: "comp-choose-streamed-video", category: "fscomp-choose",
      prompt: "A website needs to stream video to many users over the internet, keeping the file size as small as possible. Which compression method suits this best?",
      answers: ["Lossy compression"],
      keywords: [{ required: [["lossy"]], excluded: ["lossless"] }],
      distractors: ["Lossless compression", "No compression should ever be used", "Only run-length encoding, never anything else", "Whichever method keeps the file exactly the same size"],
      hint: "Lossy",
      note: "A much smaller file streams faster and uses less storage - a small, hard-to-notice quality loss is an acceptable trade-off."
    },
    {
      id: "comp-choose-flag", category: "fscomp-choose",
      prompt: "Which kind of image would run-length encoding compress well?",
      answers: ["A flag or simple logo with large blocks of one solid colour"],
      keywords: [{ required: [["flag", "logo", "block", "blocks", "solid", "flat"]] }],
      distractors: ["A detailed photograph of a forest", "A picture where every pixel is a slightly different colour", "A page of small text"],
      hint: "Large blocks of one colour",
      note: "RLE only shrinks data when there are long runs of identical pixels."
    },
    {
      id: "comp-choose-photo", category: "fscomp-choose",
      prompt: "A detailed photograph, with almost no two neighbouring pixels the same colour, needs to be made much smaller for a website. Since RLE would barely help here, what should be used instead?",
      answers: ["Lossy compression"],
      keywords: [{ required: [["lossy"]], excluded: ["lossless"] }],
      distractors: ["Lossless compression, since RLE is the only lossless method", "No compression, since RLE has already failed", "A colour depth of zero bits", "Doubling the resolution first"],
      hint: "Lossy",
      note: "With no repeated runs, RLE cannot help - a lossy method removes detail a viewer is unlikely to notice instead."
    },
    {
      id: "comp-video-reason-size", category: "fscomp-choose",
      prompt: "Give one reason lossy compression is a good choice for video streamed on a website.",
      answers: ["It makes the file much smaller, so it downloads or streams faster and uses less storage"],
      keywords: [{ required: [["smaller", "faster", "storage", "download", "stream"]] }],
      distractors: ["It lets the video be reconstructed exactly, with no data lost", "It plays the video back at a higher frame rate", "It removes the need to store the audio track"],
      hint: "Smaller file, faster to send",
      note: "A much smaller file is quicker to send over a network and cheaper to store."
    }
  ]
});
