// Exam Circuit — proof-step generators.
//
// Each generator produces an unlimited stream of fresh, parameterised instances of one real
// exam skill (per GDD.md Section 4, Open Question 3), plus a checker that computes the correct
// answer algorithmically from those same parameters — never from a fixed answer list.
//
// A generator entry is: { id, regionId, label, componentType, generate(rng), check(params, raw) }
//   - generate(rng) returns { prompt, params, meta } — params is what gets stored for
//     reporting (GDD Section 4 Open Question 5's GeneratorSeed/Params column) and re-fed to check().
//   - check(params, raw) returns { correct, expected } — expected is only used for the
//     reporting sheet, never shown to the student on a wrong attempt (per the
//     "don't just give them the answer" rule).
//   - componentType is one of 'resistor' | 'ic' | 'microcontroller' (GDD Section 3.6) —
//     v1 only ever produces 'resistor' (scaffolded numeric) and 'ic' (short structured).

(function (root) {
  'use strict';

  // Deterministic PRNG (mulberry32) so a GeneratorSeed can be stored and the exact question
  // reconstructed later for the admin reporting sheet, instead of only storing the outcome.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeSeed() {
    return (Math.random() * 0xFFFFFFFF) >>> 0;
  }
  function rngFromSeed(seed) {
    return mulberry32(seed);
  }
  function randInt(rng, min, max) {
    // inclusive of both ends
    return min + Math.floor(rng() * (max - min + 1));
  }
  function toBinary8(n) {
    return n.toString(2).padStart(8, '0');
  }
  function toHex2(n) {
    return n.toString(16).toUpperCase().padStart(2, '0');
  }
  function normaliseBinaryAnswer(raw) {
    return String(raw || '').replace(/[^01]/g, '');
  }
  function normaliseIntAnswer(raw) {
    const m = String(raw || '').trim().match(/-?\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  }
  function normaliseHexAnswer(raw) {
    return String(raw || '').trim().replace(/^0x/i, '').toUpperCase();
  }

  // Real papers avoid degenerate all-zero/all-one bytes for a first conversion question, so the
  // generator's bounds keep at least one 0 and one 1 bit — this is the "realistic bounds taken
  // from the real papers" step from GDD.md Section 4, Open Question 3.
  function randomByteAvoidingExtremes(rng) {
    let n;
    do { n = randInt(rng, 0, 255); } while (n === 0 || n === 255);
    return n;
  }

  const GENERATORS = [
    {
      id: 'bin-to-denary',
      regionId: '1.1',
      label: 'Binary → denary',
      componentType: 'resistor',
      basedOn: 'Cambridge 0478 Paper 1, Number Systems (denary/binary conversion questions)',
      generate: function (rng) {
        const value = randomByteAvoidingExtremes(rng);
        const bin = toBinary8(value);
        return {
          prompt: 'Convert this 8-bit binary number to denary: ' + bin,
          params: { value: value, bin: bin },
        };
      },
      check: function (params, raw) {
        const answer = normaliseIntAnswer(raw);
        return { correct: answer === params.value, expected: String(params.value) };
      },
      hint: 'Write out the place values (128, 64, 32, 16, 8, 4, 2, 1) above each bit, then add up only the columns with a 1.',
    },
    {
      id: 'denary-to-bin',
      regionId: '1.1',
      label: 'Denary → binary',
      componentType: 'resistor',
      basedOn: 'Cambridge 0478 Paper 1, Number Systems (denary/binary conversion questions)',
      generate: function (rng) {
        const value = randomByteAvoidingExtremes(rng);
        return {
          prompt: 'Convert this denary number to 8-bit binary: ' + value,
          params: { value: value },
        };
      },
      check: function (params, raw) {
        const answer = normaliseBinaryAnswer(raw);
        return { correct: answer === toBinary8(params.value), expected: toBinary8(params.value) };
      },
      hint: 'Work from the largest place value (128) down to the smallest (1) - at each step, can you subtract that place value and still have zero or more left?',
    },
    {
      id: 'bin-to-hex',
      regionId: '1.1',
      label: 'Binary → hexadecimal',
      componentType: 'ic',
      basedOn: 'Cambridge 0478 Paper 1, Number Systems (hexadecimal conversion questions)',
      generate: function (rng) {
        const value = randomByteAvoidingExtremes(rng);
        const bin = toBinary8(value);
        return {
          prompt: 'Convert this 8-bit binary number to hexadecimal: ' + bin,
          params: { value: value, bin: bin },
        };
      },
      check: function (params, raw) {
        const answer = normaliseHexAnswer(raw);
        return { correct: answer === toHex2(params.value), expected: toHex2(params.value) };
      },
      hint: 'Split the byte into its two nibbles (4 bits each) and convert each nibble to a single hex digit separately.',
    },
    {
      id: 'twos-complement',
      regionId: '1.1',
      label: "Two's complement (negative binary)",
      componentType: 'ic',
      basedOn: 'Cambridge 0478/13 June 2025 Q1 (two’s complement byte)',
      generate: function (rng) {
        // Force the top bit set so the value reads as negative in two's complement.
        const magnitude = randInt(rng, 1, 100);
        const twosComp = (256 - magnitude) & 0xFF;
        const bin = toBinary8(twosComp);
        return {
          prompt: "This 8-bit byte is stored in two's complement: " + bin + '. What denary value does it represent?',
          params: { bin: bin, expectedValue: -magnitude },
        };
      },
      check: function (params, raw) {
        const answer = normaliseIntAnswer(raw);
        return { correct: answer === params.expectedValue, expected: String(params.expectedValue) };
      },
      hint: "The leading 1 means this is negative - invert every bit, add 1, convert that to denary as normal, then put a minus sign in front.",
    },
    {
      id: 'image-file-size',
      regionId: '1.2',
      label: 'Image file size',
      componentType: 'resistor',
      basedOn: 'Cambridge 0478 Paper 1, Data Representation (bitmap file size calculations)',
      generate: function (rng) {
        // Keep width/height/colourDepth combinations that give a whole number of bytes, so
        // there's no rounding ambiguity - matches how real papers choose clean numbers.
        const depths = [1, 2, 4, 8, 24];
        let width, height, depth, totalBits;
        do {
          width = randInt(rng, 20, 400);
          height = randInt(rng, 20, 400);
          depth = depths[randInt(rng, 0, depths.length - 1)];
          totalBits = width * height * depth;
        } while (totalBits % 8 !== 0);
        const bytes = totalBits / 8;
        return {
          prompt: 'An uncompressed bitmap image is ' + width + ' x ' + height + ' pixels, using ' +
            depth + '-bit colour depth. Calculate its file size in bytes.',
          params: { width: width, height: height, depth: depth, bytes: bytes },
        };
      },
      check: function (params, raw) {
        const answer = normaliseIntAnswer(raw);
        return { correct: answer === params.bytes, expected: String(params.bytes) };
      },
      hint: 'File size in bits = width x height x colour depth. Work that out first, then divide by 8 to get bytes.',
    },
    {
      id: 'sound-file-size',
      regionId: '1.2',
      label: 'Sound file size',
      componentType: 'ic',
      basedOn: 'Cambridge 0478 Paper 1, Data Representation (sound sampling/file size calculations)',
      generate: function (rng) {
        const sampleRates = [8000, 11025, 22050, 44100];
        const bitDepths = [8, 16];
        const channelsOptions = [1, 2];
        let sampleRate, duration, bitDepth, channels, totalBits;
        do {
          sampleRate = sampleRates[randInt(rng, 0, sampleRates.length - 1)];
          duration = randInt(rng, 1, 20);
          bitDepth = bitDepths[randInt(rng, 0, bitDepths.length - 1)];
          channels = channelsOptions[randInt(rng, 0, channelsOptions.length - 1)];
          totalBits = sampleRate * duration * bitDepth * channels;
        } while (totalBits % 8 !== 0);
        const bytes = totalBits / 8;
        return {
          prompt: 'A sound is recorded at a sample rate of ' + sampleRate + ' Hz, with a sample resolution of ' +
            bitDepth + ' bits, for ' + duration + ' seconds, in ' + (channels === 1 ? 'mono (1 channel)' : 'stereo (2 channels)') +
            '. Calculate the uncompressed file size in bytes.',
          params: { sampleRate: sampleRate, duration: duration, bitDepth: bitDepth, channels: channels, bytes: bytes },
        };
      },
      check: function (params, raw) {
        const answer = normaliseIntAnswer(raw);
        return { correct: answer === params.bytes, expected: String(params.bytes) };
      },
      hint: 'File size in bits = sample rate x sample resolution x duration x number of channels. Work that out first, then divide by 8 to get bytes.',
    },
    {
      id: 'ascii-to-binary',
      regionId: '1.2',
      label: 'Character → binary (ASCII)',
      componentType: 'resistor',
      basedOn: 'Cambridge 0478 Paper 1, Data Representation (character encoding questions)',
      generate: function (rng) {
        // Printable ASCII 33-126 - real, uppercase/lowercase/digit/punctuation characters only.
        const code = randInt(rng, 33, 126);
        const char = String.fromCharCode(code);
        return {
          prompt: "Using the standard ASCII character set, what is the 8-bit binary code for the character '" + char + "'?",
          params: { code: code, char: char },
        };
      },
      check: function (params, raw) {
        const answer = normaliseBinaryAnswer(raw);
        return { correct: answer === toBinary8(params.code), expected: toBinary8(params.code) };
      },
      hint: 'Look up (or recall) the character\'s ASCII decimal code first, then convert that denary number to 8-bit binary the same way as in 1.1.',
    },
  ];

  const api = {
    GENERATORS: GENERATORS,
    makeSeed: makeSeed,
    rngFromSeed: rngFromSeed,
    byId: function (id) {
      return GENERATORS.find(function (g) { return g.id === id; }) || null;
    },
    byRegion: function (regionId) {
      return GENERATORS.filter(function (g) { return g.regionId === regionId; });
    },
    // Produces one fresh attempt: which generator, its seed, and the rendered prompt/params.
    // Storing { generatorId, seed } is enough to reconstruct the exact question later for the
    // admin reporting sheet (GDD.md Section 4, Open Question 5's GeneratorSeed/Params column).
    attempt: function (generatorId) {
      const gen = api.byId(generatorId);
      if (!gen) throw new Error('Unknown generator: ' + generatorId);
      const seed = makeSeed();
      const rng = rngFromSeed(seed);
      const produced = gen.generate(rng);
      return {
        generatorId: generatorId,
        seed: seed,
        regionId: gen.regionId,
        componentType: gen.componentType,
        prompt: produced.prompt,
        params: produced.params,
        hint: gen.hint,
        basedOn: gen.basedOn,
      };
    },
    check: function (generatorId, params, raw) {
      const gen = api.byId(generatorId);
      if (!gen) throw new Error('Unknown generator: ' + generatorId);
      return gen.check(params, raw);
    },
  };

  root.ExamCircuitGenerators = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
