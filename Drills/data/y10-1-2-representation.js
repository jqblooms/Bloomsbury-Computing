// Year 10, 1.2 Text, Sound & Image Representation
// Loaded by Drills/index.html?drill=y10-1-2-representation
DrillData.register("y10-1-2-representation", {
  title: "Year 10, 1.2 Text, Sound & Image Representation",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["text", "Text Representation"],
    ["sound", "Sound Representation"],
    ["image", "Image Representation"]
  ],
  cards: [
    {
            id: "why-text-binary",
            category: "text",
            prompt: "Why must text be converted into binary?",
            answers: [
                    "Electronic components can only reliably represent two states, 0 and 1"
            ],
            distractors: [
                    "Text characters are physically too large to store in memory chips",
                    "Denary digits cannot be sent electronically between components",
                    "Binary was the very first number system to ever be invented",
                    "A keyboard can only send two-digit codes to a computer",
                    "Converting to binary lets text be read directly by a human",
                    "Letters need converting because screens can only show numbers"
            ]
    },
    {
            id: "character-set-def",
            category: "text",
            prompt: "What is a character set?",
            answers: [
                    "A list of characters, each given a unique binary code"
            ],
            distractors: [
                    "A collection of fonts that a computer is able to display",
                    "The complete set of keys found on a keyboard layout",
                    "A list of every symbol a printer is able to print",
                    "A group of characters reserved only for passwords",
                    "The fixed order that letters appear in the alphabet",
                    "A set of characters that only programmers are allowed to use"
            ]
    },
    {
            id: "standard-charset-why",
            category: "text",
            prompt: "Why is it important that computers use a standard character set?",
            answers: [
                    "So every device reads the same binary code as the same character"
            ],
            // Core concept is agreement/consistency between devices about
            // what a code means - the auto-derived fallback needed 4 of
            // {every, device, read, same, binary, code, character}, which
            // a fair paraphrase like "so all devices agree on characters"
            // couldn't reach even though it clearly says the right thing.
            keywords: [
                    {
                            required: [["same", "consistent", "consistency", "agree", "agreement", "standard", "standardised", "standardized"]],
                            optional: ["device", "computer", "character", "code", "binary", "read"],
                            need: 1
                    }
            ],
            distractors: [
                    "So text files always take up less space than image files",
                    "So keyboards can be manufactured more cheaply worldwide",
                    "So a document can only ever be opened by one person",
                    "So text always displays using exactly the same font",
                    "So printers are able to print in more colours",
                    "So passwords become much harder for anyone to guess"
            ]
    },
    {
            id: "ascii-def",
            category: "text",
            prompt: "What is ASCII?",
            answers: [
                    "A character set giving each character a unique code, mainly for English"
            ],
            distractors: [
                    "A programming language used to build interactive websites",
                    "A type of image file format used for storing photographs",
                    "A method used to compress text files before sending them",
                    "A network protocol used specifically for sending emails",
                    "A unit used to measure how large a file is in bytes",
                    "A type of check used to detect errors during data transfer"
            ]
    },
    {
            id: "ascii-bits",
            category: "text",
            prompt: "How many bits does standard ASCII use to represent one character?",
            answers: [
                    "7 bits"
            ],
            distractors: [
                    "8 bits",
                    "4 bits",
                    "16 bits",
                    "1 byte",
                    "2 bits",
                    "32 bits"
            ],
            note: "Standard ASCII uses 7 bits (128 characters); extended ASCII uses 8 bits (256 characters)."
    },
    {
            id: "ascii-max-chars",
            category: "text",
            prompt: "How many different characters can standard 7-bit ASCII represent?",
            answers: [
                    "128"
            ],
            distractors: [
                    "256",
                    "127",
                    "64",
                    "16",
                    "512",
                    "100"
            ]
    },
    {
            id: "unicode-def",
            category: "text",
            prompt: "What is Unicode?",
            answers: [
                    "A character set covering characters from every language, plus symbols and emojis"
            ],
            // "Covers many/every language" (vs ASCII's English-only) IS
            // the distinguishing concept - the auto-derived fallback
            // needed 4 of 9 words, which "covers all languages and
            // emoji" (a genuinely correct paraphrase) couldn't reach.
            // A bare "language" requirement would also match the wrong
            // "faster version of the ASCII programming language"
            // distractor (it contains "language" too) - the optional
            // gate rules that out, since a wrong "programming language"
            // answer never also says "cover"/"every"/"symbol"/"emoji".
            // Note: optional/required tokens here are the STEMMED forms
            // tokenize() actually produces (e.g. "covers" -> "cover",
            // "emojis" -> "emoji") - the plural spellings themselves
            // never appear in `have`, so only the stemmed form matters.
            keywords: [
                    {
                            required: [["language"]],
                            optional: ["cover", "covering", "every", "all", "many", "character", "set", "symbol", "emoji"],
                            need: 1,
                            // "A character set covering European languages, but no
                            // others" also hits "language"+"covering"+"character"+
                            // "set", passing the gate above - it names a SPECIFIC
                            // restricted region rather than "every"/"all"/"many",
                            // so it needs its own exclusion.
                            excluded: ["european", "only"]
                    }
            ],
            distractors: [
                    "A character set used only for scientific and mathematical symbols",
                    "A newer, faster version of the ASCII programming language",
                    "A file compression standard designed only for text documents",
                    "A character set covering European languages, but no others",
                    "A method used to encrypt text so nobody else can read it",
                    "A style of font commonly used for headings in web design"
            ]
    },
    {
            id: "ascii-vs-unicode",
            category: "text",
            prompt: "What is the main difference between ASCII and Unicode?",
            answers: [
                    "ASCII covers basic English only; Unicode covers almost every language and symbol"
            ],
            distractors: [
                    "ASCII represents images, while Unicode represents text instead",
                    "ASCII can be processed by computers, but Unicode cannot be",
                    "Unicode can only store numbers, never any letters at all",
                    "ASCII was invented several decades after Unicode was created",
                    "Unicode is unable to represent the standard English alphabet",
                    "ASCII stores every character as denary, never as binary"
            ]
    },
    {
            id: "why-unicode-more-chars",
            category: "text",
            prompt: "Why can Unicode represent far more characters than ASCII?",
            answers: [
                    "It uses more bits per character, giving far more possible codes"
            ],
            distractors: [
                    "It stores every character as a tiny compressed image file",
                    "It runs on a completely different type of computer memory",
                    "Every character is compressed before it gets stored anywhere",
                    "It reuses the same ASCII code for several different characters",
                    "It stores each character in hexadecimal instead of in binary",
                    "It ignores the normal rules that binary numbers follow"
            ]
    },
    {
            id: "why-unicode-more-bits",
            category: "text",
            prompt: "Why does Unicode generally need more bits per character than ASCII?",
            answers: [
                    "It needs a unique code for far more characters, languages and symbols"
            ],
            distractors: [
                    "Extra bits are needed to record the character's on-screen colour",
                    "Unicode characters are designed to display larger on a screen",
                    "Every single Unicode character includes a built-in error check",
                    "Unicode stores two identical copies of each character, as backup",
                    "The extra bits simply record which font the character is shown in",
                    "Unicode characters need the extra bits purely so they can be printed"
            ]
    },
    {
            id: "bits-to-chars-power",
            category: "text",
            prompt: "If a character set uses n bits per character, how many different characters can it represent?",
            answers: [
                    "2 to the power of n"
            ],
            // "n multiplied by 2" and "2 multiplied by n" both contain
            // "2" and "n" too - only a real exponent phrasing should pass.
            keywords: [/2.*(power|\^|exponent).*n\b|n.*(power|\^|exponent).*2/i],
            distractors: [
                    "n multiplied by 2",
                    "n squared",
                    "10 to the power of n",
                    "n multiplied by 8",
                    "2 multiplied by n",
                    "n divided by 2"
            ],
            note: "Same idea as binary place values - n bits give 2^n possible patterns."
    },
    {
            id: "unicode-can-represent",
            category: "text",
            type: "multi",
            show: 6,
            prompt: "Which of these can Unicode represent that standard ASCII cannot? (Pick every one shown that is correct.)",
            answers: [
                    "Chinese and Arabic characters",
                    "Emojis",
                    "Accented letters like é and ñ",
                    "Extra currency and maths symbols"
            ],
            distractors: [
                    "Capital English letters",
                    "The digits 0 to 9",
                    "Basic punctuation marks",
                    "Lower-case English letters"
            ]
    },
    {
            id: "ascii-decode-apply",
            category: "text",
            prompt: "In ASCII, the denary code 77 represents which character?",
            answers: ["M"],
            keywords: [/^\s*M\s*$/],
            distractors: ["L", "N", "13"],
            note: "Capital letters run A=65 to Z=90, in order, so code 77 is M.",
            randomize: function () {
                    var pool = [["A",65],["B",66],["C",67],["G",71],["M",77],["S",83],["Z",90],["a",97],["b",98],["g",103],["m",109],["s",115],["z",122],["0",48],["5",53],["9",57]];
                    var pick = pool[Math.floor(Math.random() * pool.length)];
                    var ch = pick[0], code = pick[1];
                    var caseFlip = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase();
                    return {
                            prompt: "In ASCII, the denary code " + code + " represents which character?",
                            answers: [ch],
                            keywords: [new RegExp("^\\s*" + ch + "\\s*$")],
                            distractors: dedupeDistractors(ch, [String.fromCharCode(code - 1), String.fromCharCode(code + 1), caseFlip]),
                            note: "Look up the ASCII table: code " + code + " is the character '" + ch + "'."
                    };
            }
    },
    {
            id: "ascii-encode-apply",
            category: "text",
            prompt: "What is the ASCII denary code for the character 'M'?",
            answers: ["77"],
            keywords: [/^\s*77\s*$/],
            distractors: ["76", "78", "13"],
            note: "Capital letters run A=65 to Z=90, in order, so M (the 13th letter) is 65+12 = 77.",
            randomize: function () {
                    var pool = [["A",65],["B",66],["C",67],["G",71],["M",77],["S",83],["Z",90],["a",97],["b",98],["g",103],["m",109],["s",115],["z",122],["0",48],["5",53],["9",57]];
                    var pick = pool[Math.floor(Math.random() * pool.length)];
                    var ch = pick[0], code = pick[1];
                    return {
                            prompt: "What is the ASCII denary code for the character '" + ch + "'?",
                            answers: [String(code)],
                            keywords: [new RegExp("^\\s*" + code + "\\s*$")],
                            distractors: dedupeDistractors(code, [code - 1, code + 1, code + 32, code - 32]),
                            note: "Look up the ASCII table: '" + ch + "' has denary code " + code + "."
                    };
            }
    },

    {
            id: "analogue-vs-digital",
            category: "sound",
            prompt: "What is the difference between an analogue signal and a digital signal?",
            answers: [
                    "Analogue varies continuously; digital only has fixed, discrete values"
            ],
            distractors: [
                    "Analogue signals are always louder than digital signals are",
                    "A digital signal can only ever be heard by a computer",
                    "An analogue signal is only able to travel through a wire",
                    "A digital signal never involves the use of numbers at all",
                    "An analogue signal is never able to be recorded at all",
                    "Digital signals are always higher quality, without exception"
            ]
    },
    {
            id: "sound-to-binary",
            category: "sound",
            prompt: "How is analogue sound converted into binary?",
            answers: [
                    "By sampling the wave's amplitude at intervals and storing each as binary"
            ],
            distractors: [
                    "By recording the exact shape of the wave as a continuous line",
                    "By converting the sound directly into a hexadecimal number",
                    "By compressing the sound file before it is ever played back",
                    "By measuring the frequency of the whole recording just once",
                    "By saving a picture of the waveform instead of any numbers",
                    "By counting how many speakers will eventually play the sound"
            ]
    },
    {
            id: "sampling-def",
            category: "sound",
            prompt: "What is sampling, in the context of digital audio?",
            answers: [
                    "Measuring a sound wave's amplitude at regular time intervals"
            ],
            distractors: [
                    "Playing a short clip of a song before you decide to buy it",
                    "Cutting a long recording down to make it shorter overall",
                    "Copying a sound recording from one file into another file",
                    "Removing unwanted background noise from a live recording",
                    "Converting an existing sound file into a different format",
                    "Recording the same sound using more than one microphone"
            ]
    },
    {
            id: "sample-rate-def-12",
            category: "sound",
            prompt: "What is sample rate?",
            answers: [
                    "The number of samples taken every second, measured in Hz"
            ],
            distractors: [
                    "The number of bits used to store each individual sample",
                    "The total length of a recording, measured in seconds",
                    "How loud a recording sounds when it is played back",
                    "The number of speakers a recording is played through",
                    "The particular file format used to save a recording",
                    "The number of times a recording has already been played"
            ]
    },
    {
            id: "sample-resolution-def-12",
            category: "sound",
            prompt: "What is sample resolution?",
            answers: [
                    "The number of bits used to store each individual sample"
            ],
            distractors: [
                    "The number of samples that are taken every single second",
                    "The number of distinct sounds that appear in a recording",
                    "How clear a recording sounds to an ordinary human ear",
                    "The overall length of the recording, measured in seconds",
                    "The number of microphones that were used to record it",
                    "The speed at which the recording is played back to you"
            ]
    },
    {
            id: "effect-rate-quality",
            category: "sound",
            prompt: "What is the effect of increasing the sample rate on how closely a recording matches the original sound?",
            answers: [
                    "More accurate, since fast wave changes are less likely to be missed"
            ],
            // "accurate" alone isn't enough since several distractors also
            // say "accurate" while arguing the opposite direction or
            // denying rate has any effect at all. A plain excluded:
            // ["less",...] would also reject the REAL answer here (it
            // legitimately says "less likely to be missed") - so this
            // needs the phrase "more accurate" itself, not just the
            // presence/absence of individual direction words, with "no"/
            // "only" ruled out so "No more accurate..." and "...only if
            // resolution is increased too" don't slip through on the
            // same substring.
            keywords: [/^(?!.*\bno\b)(?!.*\bonly\b).*\bmore\s+accurate\b/i],
            distractors: [
                    "Less accurate, since fewer of the wave's changes can be captured",
                    "No more accurate, since accuracy only ever depends on resolution",
                    "Less accurate, since each individual sample gets rounded more",
                    "No effect on accuracy, since rate only ever changes file size",
                    "More accurate only if resolution is increased at the same time",
                    "Less accurate, since more samples means more rounding mistakes"
            ]
    },
    {
            id: "effect-rate-filesize",
            category: "sound",
            prompt: "What is the effect of increasing the sample rate on file size?",
            answers: [
                    "Increases the file size, since more samples are stored per second"
            ],
            // "Decreases"/"no effect" distractors also say "file size" -
            // require the actual direction word and exclude the opposite.
            keywords: [
                    {
                            required: [["increase", "increases", "bigger", "larger", "more"]],
                            excluded: ["decrease", "decreases", "smaller", "less", "no", "fewer", "never"]
                    }
            ],
            distractors: [
                    "Decreases the file size, since each sample stores less detail",
                    "No effect on file size, since rate only affects the sound quality",
                    "Only changes the file size for recordings that use one channel",
                    "Decreases the file size, since fewer bits are needed per sample",
                    "Doubles the file size no matter how large the rate increase is",
                    "Changes the file's format, but never actually changes its size"
            ]
    },
    {
            id: "effect-resolution-quality",
            category: "sound",
            prompt: "What is the effect of increasing sample resolution on the accuracy of a recording?",
            answers: [
                    "More accurate, since each sample can store more amplitude values"
            ],
            // "More accurate" IS the answer to an "effect on accuracy"
            // question - the auto-derived fallback needed 4 of 9 words
            // (including "since" and "can", not central to the concept),
            // which "more accurate sound" alone couldn't reach. Excludes
            // "less"/"fewer"/"no" - the wrong-direction distractors
            // ("Less accurate...", "No effect on accuracy...") also
            // contain "accurate"/"accuracy", but mean the opposite.
            keywords: [
                    {
                            required: [["accurate", "accuracy", "precise", "precision"]],
                            // "Accuracy only ever depends on the sample rate that was
                            // used" contains "accuracy" too but denies resolution has
                            // any effect at all - "rate" and "only" catch it.
                            excluded: ["less", "fewer", "lower", "worse", "decrease", "no", "not", "none", "rate", "only"]
                    }
            ],
            distractors: [
                    "Less accurate, since each sample can now store fewer values",
                    "No effect on accuracy, since resolution only changes file size",
                    "Only affects how long the recording is, not its accuracy",
                    "Makes the recording play back faster than it was recorded",
                    "Accuracy only ever depends on the sample rate that was used",
                    "Reduces background noise, but changes nothing else about it"
            ]
    },
    {
            id: "effect-resolution-filesize",
            category: "sound",
            prompt: "What is the effect of increasing sample resolution on file size?",
            answers: [
                    "Increases the file size, since more bits are stored for every sample"
            ],
            keywords: [
                    {
                            required: [["increase", "increases", "bigger", "larger", "more"]],
                            excluded: ["decrease", "decreases", "smaller", "less", "no", "fewer", "never", "halve", "halves", "rate"]
                    }
            ],
            distractors: [
                    "Decreases the file size, since each sample needs fewer numbers",
                    "No effect on file size, since resolution only affects quality",
                    "File size only ever depends on the sample rate, not resolution",
                    "Only affects file size if the sample rate is also increased",
                    "Changes the file's format, but never actually changes its size",
                    "Halves the file size, no matter how much the resolution rises"
            ]
    },
    {
            id: "sound-quality-and-filesize-multi",
            category: "sound",
            type: "multi",
            show: 6,
            prompt: "Which of these increase both a recording's accuracy AND its file size? (Pick every one shown that is correct.)",
            answers: [
                    "Increasing the sample rate",
                    "Increasing the sample resolution"
            ],
            distractors: [
                    "Increasing the volume level",
                    "Shortening the recording length",
                    "Renaming the sound file",
                    "Playing it through better speakers"
            ]
    },
    {
            id: "bitmap-image-def",
            category: "image",
            prompt: "What is the name for an image made up of a grid of individual pixels?",
            answers: [
                    "A bitmap image"
            ],
            distractors: [
                    "A vector image",
                    "A raster font",
                    "A pixel map file",
                    "A binary graphic",
                    "A compressed image",
                    "A resolution file"
            ],
            note: "'Bitmap' is the exam term for a pixel-based image, as opposed to a vector image."
    },
    {
            id: "pixels-def",
            category: "image",
            prompt: "How are images represented using pixels?",
            answers: [
                    "A grid of tiny individual dots (pixels), each holding one colour"
            ],
            distractors: [
                    "One single colour value that covers the whole picture at once",
                    "A set of lines and curves defined using mathematical points",
                    "A stored list of shapes, rather than a grid of individual dots",
                    "A sequence of characters, in the same way as a line of text",
                    "One extremely long binary number that has no real structure",
                    "A set of sound samples that have been converted into colour"
            ]
    },
    {
            id: "pixel-to-binary",
            category: "image",
            prompt: "How is pixel data converted into binary?",
            answers: [
                    "Each pixel's colour is stored as binary, using bits set by the colour depth"
            ],
            // "Only each pixel's position is stored, but never its own
            // colour" also has "pixel"+"stored"+"colour" (as a negated
            // word) - require "colour" AND "depth"/"bit" together, which
            // that distractor and the others never both have.
            keywords: [/colou?r.*(depth|bits?)|(depth|bits?).*colou?r/i],
            distractors: [
                    "Each pixel is converted into a character taken from a text set",
                    "Each pixel is stored only as a denary number, never as binary",
                    "Every single pixel in the image shares one shared binary value",
                    "Only each pixel's position is stored, but never its own colour",
                    "Every pixel is converted straight into hexadecimal, not binary",
                    "Each pixel is compressed first, before it is given any value"
            ]
    },
    {
            id: "image-resolution-def",
            category: "image",
            prompt: "What is image resolution?",
            answers: [
                    "The number of pixels that make up the image (width x height)"
            ],
            distractors: [
                    "The total number of colours available within the image",
                    "The size of the image once it has been printed out",
                    "The number of bits used to store each individual pixel",
                    "How compressed the image file happens to currently be",
                    "The overall brightness level shown across the image",
                    "The particular file format that the image is saved in"
            ]
    },
    {
            id: "colour-depth-def",
            category: "image",
            prompt: "What is colour depth?",
            answers: [
                    "The number of bits used to store each pixel's colour"
            ],
            distractors: [
                    "The total number of pixels that make up the whole image",
                    "The number of separate images that are stored in one file",
                    "How dark or how light the overall image appears to be",
                    "The distance between the camera and the subject it shot",
                    "The maximum number of colours a printer is able to use",
                    "The overall size of the image file, measured in bytes"
            ]
    },
    {
            id: "bit-depth-synonym",
            category: "image",
            prompt: "Which other term means exactly the same thing as colour depth?",
            answers: [
                    "Bit depth"
            ],
            distractors: [
                    "Pixel depth",
                    "Frame depth",
                    "Resolution depth",
                    "Image depth",
                    "Byte depth",
                    "Sample depth"
            ],
            note: "Colour depth and bit depth are the same thing: the number of bits used per pixel."
    },
    {
            id: "effect-resolution-quality-img",
            category: "image",
            prompt: "What is the effect of increasing an image's resolution on its quality?",
            answers: [
                    "Captures more detail, so the finished image looks sharper overall"
            ],
            keywords: [
                    {
                            required: [["detail", "sharp", "sharper", "clear", "clearer"]],
                            excluded: ["less", "blur", "blurry", "blurrier", "no", "only", "colour", "color"]
                    }
            ],
            distractors: [
                    "Captures less detail, so the finished image looks blurrier overall",
                    "Has no effect on quality, since resolution only affects file size",
                    "Only changes the colours used, without changing any real detail",
                    "Reduces the total number of colours the image is able to show",
                    "Quality only ever depends on colour depth, not on resolution",
                    "Converts the whole image into black and white automatically"
            ]
    },
    {
            id: "effect-resolution-filesize-img",
            category: "image",
            prompt: "What is the effect of increasing an image's resolution on its file size?",
            answers: [
                    "Increases the file size, since there are now more pixels to store"
            ],
            keywords: [
                    {
                            required: [["increase", "increases", "bigger", "larger", "more"]],
                            excluded: ["decrease", "decreases", "smaller", "less", "no", "fewer", "never", "halve", "halves"]
                    }
            ],
            distractors: [
                    "Decreases the file size, since each pixel needs fewer bits stored",
                    "Has no effect on file size, since resolution only affects quality",
                    "File size only ever depends on colour depth, not on resolution",
                    "Only affects the file size if the image is also compressed",
                    "Changes the file's format, but never actually changes its size",
                    "Halves the file size, no matter how much the resolution rises"
            ]
    },
    {
            id: "effect-colourdepth-quality",
            category: "image",
            prompt: "What is the effect of increasing colour depth on image quality?",
            answers: [
                    "More colours become possible, giving a more realistic final image"
            ],
            keywords: [
                    {
                            required: [["more"]],
                            excluded: ["fewer", "less", "no", "only", "same"]
                    }
            ],
            distractors: [
                    "Fewer colours become possible, giving a less realistic final image",
                    "Has no effect on the colours the image is able to show at all",
                    "Only affects the image's resolution, not its available colours",
                    "Makes every single pixel in the image turn out the same colour",
                    "Quality only ever depends on resolution, not on colour depth",
                    "Automatically converts the whole image into greyscale instead"
            ]
    },
    {
            id: "effect-colourdepth-filesize",
            category: "image",
            prompt: "What is the effect of increasing colour depth on file size?",
            answers: [
                    "Increases the file size, since more bits are stored for every pixel"
            ],
            keywords: [
                    {
                            required: [["increase", "increases", "bigger", "larger", "more"]],
                            excluded: ["decrease", "decreases", "smaller", "less", "no", "fewer", "never", "halve", "halves"]
                    }
            ],
            distractors: [
                    "Decreases the file size, since each pixel needs fewer bits stored",
                    "Has no effect on file size, since colour depth only affects quality",
                    "File size only ever depends on resolution, not on colour depth",
                    "Only affects the file size if the resolution is also increased",
                    "Changes the file's format, but never actually changes its size",
                    "Halves the file size, no matter how much the colour depth rises"
            ]
    },
    {
            id: "image-filesize-factors",
            category: "image",
            type: "multi",
            show: 6,
            prompt: "Which of these affect an image's file size? (Pick every one shown that is correct.)",
            answers: [
                    "Resolution",
                    "Colour depth"
            ],
            distractors: [
                    "The image's file name",
                    "The screen's brightness setting",
                    "The name of its folder",
                    "The monitor's refresh rate"
            ]
    }
]
});
