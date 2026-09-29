// Year 10, 2.1 L2 Do Now: a recap of every Year 10 topic so far
// Loaded by Drills/index.html?drill=y10-2-1-l2-recap
// Ten cards, two per topic: 1.1 Number Systems, 1.2 Text, Sound and Images, 1.3 Storage and File Size,
// 1.3 Compression and 2.1 L1 Packets. Every card draws a fresh question each time; some draws are the real
// past-paper question, cited in the note. Number cards carry `example` (a similar question worked through);
// word cards carry only `working` nudges, since an example with another word would narrow the answer down.
DrillData.register("y10-2-1-l2-recap", {
  title: "Year 10, 2.1 L2 Do Now: Recap So Far",
  subtitle: "Cambridge IGCSE Computer Science 0478: Number Systems to Packets",
  categories: [
    ["rc-numbers", "1.1 Number Systems"],
    ["rc-represent", "1.2 Text, Sound and Images"],
    ["rc-storage", "1.3 Storage and File Size"],
    ["rc-compress", "1.3 Compression"],
    ["rc-packets", "2.1 Packets"]
  ],
  cards: (function () {
    var pick = drillPick;
    function hex(n) { return n.toString(16).toUpperCase(); }
    function bits(n, width) { var s = n.toString(2); while (s.length < width) s = "0" + s; return s; }
    function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    // Binary or hex typed with any spacing between the digits.
    function digitsRe(s) { return new RegExp("^\\s*" + String(s).split("").map(reEsc).join("\\s*") + "\\s*$", "i"); }
    // A whole number, with or without thousands commas, the unit optional.
    function numRe(n, unit) {
      var body = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",?");
      return new RegExp("^\\s*" + (n < 0 ? "[-\\u2212]\\s*" : "") + body + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i");
    }
    function wordRe(src) { return new RegExp("^\\s*(the\\s+|an?\\s+)?(" + src + ")\\s*$", "i"); }
    function others(answer, list) { return drillWrongNumbers(String(answer), list.map(String), 4); }
    function fromPaper(ref) { return "From Cambridge IGCSE " + ref + "."; }

    /**
     * A card built from question kinds: each kind(real) returns
     * { prompt, answer, re, wrong, steps, working, note }. A draw picks a kind; when that kind has a real
     * past-paper version it is used about a third of the time. The worked example is a random draw of the same
     * kind with a different answer that nowhere mentions this card's answer.
     */
    function card(id, category, kinds, withExample) {
      return { id: id, category: category, randomize: function () {
        var kind = pick(kinds), c = kind(Math.random() < 0.35), example = null;
        if (withExample) {
          var ans = String(c.answer).toLowerCase();
          var mentions = new RegExp("(^|[^a-z0-9])" + reEsc(ans) + "($|[^a-z0-9])");
          for (var i = 0; i < 60 && !example; i++) {
            var e = kind(false), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
            if (String(e.answer) !== String(c.answer) && e.prompt !== c.prompt && !mentions.test(text)) {
              example = "A similar question:\n" + e.prompt + "\n" + e.steps.join("\n") + "\nAnswer: " + e.answer;
            }
          }
        }
        return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
          working: c.working, example: example, note: c.note };
      } };
    }

    // ================================================================ 1.1 Number Systems
    var PLACE = [128, 64, 32, 16, 8, 4, 2, 1];
    function placeSteps(n) {
      var used = PLACE.filter(function (p) { return n & p; });
      return ["Place values: 128 64 32 16 8 4 2 1.", used.join(" + ") + " = " + n + ", so put a 1 under " + (used.length > 1 ? "each of those" : "that one") + " and 0 elsewhere."];
    }
    function toBinary(real) {
      var n = real ? 230 : drillRange(20, 255);
      var b = bits(n, 8);
      return { prompt: "Convert the denary number " + n + " to 8-bit binary.", answer: b, re: digitsRe(b),
        wrong: others(b, [bits(n ^ 1, 8), bits(n ^ 16, 8), bits((n << 1) & 255, 8), bits(255 - n, 8)]),
        steps: placeSteps(n),
        working: ["Write the place values 128 64 32 16 8 4 2 1.", "Take away the biggest place value that fits, then keep going with what is left."],
        note: placeSteps(n)[1] + " " + n + " = " + b + "." + (real ? " " + fromPaper("0478/12, June 2025, Question 1(c)") : "") };
    }
    function toHex(real) {
      var n = real ? 236 : drillRange(26, 255), h = hex(n);
      var hi = n >> 4, lo = n & 15;
      var letters = [hi, lo].filter(function (d) { return d > 9; });
      var steps = [n + " / 16 = " + hi + " remainder " + lo + ".", letters.length
        ? letters.map(function (d) { return d + " is " + hex(d); }).join(" and ") + " in hexadecimal."
        : "Both are under 10, so each is already a hexadecimal digit."];
      return { prompt: "Convert the denary number " + n + " into hexadecimal.", answer: h, re: digitsRe(h),
        wrong: others(h, [hex(lo) + hex(hi), hex(n + 1), hi + "" + lo, hex(n ^ 16)]), steps: steps,
        working: ["Divide by 16: the whole number part is the first digit, the remainder is the second.", "10 to 15 are written A to F."],
        note: steps.join(" ") + " " + n + " = " + h + "." + (real ? " " + fromPaper("0478/12, March 2024, Question 8(a)(i)") : "") };
    }
    function hexToBinary(real) {
      var h = real ? pick(["8AD", "14B"]) : hex(drillRange(26, 255));
      var b = h.split("").map(function (d) { return bits(parseInt(d, 16), 4); }).join("");
      var steps = h.split("").map(function (d) { return d + " = " + bits(parseInt(d, 16), 4); });
      // Leading 0s may be left off.
      var re = new RegExp("^\\s*(0\\s*)*" + b.replace(/^0+/, "").split("").join("\\s*") + "\\s*$");
      return { prompt: "Convert the hexadecimal number " + h + " to binary.", answer: b, re: re,
        wrong: others(b, [b.split("").reverse().join(""), bits(parseInt(h, 16) + 1, b.length), bits(parseInt(h, 16) ^ 2, b.length), bits(parseInt(h, 16) >> 1, b.length)]),
        steps: ["Each hex digit becomes 4 bits (8 4 2 1): " + steps.join(", ") + "."],
        working: ["Each hexadecimal digit becomes one group of 4 bits.", "Use 8 4 2 1 for each group; A is 10 and F is 15."],
        note: steps.join(", ") + ", so " + h + " = " + b + "." +
          (real ? " " + fromPaper(h === "8AD" ? "0478/12, June 2025, Question 1(d)" : "0478/11, June 2025, Question 2(b)(i)") : "") };
    }

    function addition(real) {
      var a, b;
      if (real) { a = 101; b = 112; } else { a = drillRange(20, 140); b = drillRange(20, 255 - a); }
      var s = a + b, A = bits(a, 8), B = bits(b, 8), S = bits(s, 8);
      return { prompt: "Add these two 8-bit binary numbers. Give your answer in binary: " + A + " + " + B, answer: S, re: digitsRe(S),
        wrong: others(S, [bits(a ^ b, 8), bits((s + 1) & 255, 8), bits((s - 1) & 255, 8), bits(s ^ 8, 8)]),
        steps: ["Work from the right: 0 + 0 = 0, 1 + 0 = 1, 1 + 1 = 0 carry 1, 1 + 1 + 1 = 1 carry 1.", A + " + " + B + ": check in denary, " + a + " + " + b + " = " + s + "."],
        working: ["Add each column from the right, carrying into the next column.", "1 + 1 = 0 carry 1, and 1 + 1 + 1 = 1 carry 1."],
        note: A + " + " + B + " = " + S + " (" + a + " + " + b + " = " + s + ")." + (real ? " " + fromPaper("0478/12, June 2025, Question 1(e)") : "") };
    }
    function shift(real) {
      var n, places, dir;
      if (real) { n = 164; places = 2; dir = "right"; } else { dir = pick(["left", "right"]); places = drillRange(1, 3); n = dir === "left" ? drillRange(3, 255 >> places) : drillRange(64, 255); }
      var out = dir === "left" ? (n << places) & 255 : n >> places, I = bits(n, 8), O = bits(out, 8);
      return { prompt: "A logical " + dir + " shift of " + places + " place" + (places > 1 ? "s" : "") + " is performed on the binary number " + I + ". Give the binary number stored after the shift.", answer: O, re: digitsRe(O),
        wrong: others(O, [bits(dir === "left" ? n >> places : (n << places) & 255, 8), bits(dir === "left" ? (n << (places + 1)) & 255 : n >> (places + 1), 8), bits(dir === "left" ? (n << Math.max(1, places - 1)) & 255 : n >> Math.max(1, places - 1), 8), I]),
        steps: ["Move every bit " + places + " place" + (places > 1 ? "s" : "") + " to the " + dir + ".", "Bits that fall off the end are lost; the gaps fill with 0s."],
        working: ["Every bit moves the same number of places.", "Bits pushed off the end are lost, and the empty places become 0."],
        note: I + " shifted " + dir + " " + places + ": " + O + "." + (real ? " " + fromPaper("0478/13, June 2025, Question 1(c)(iii)") : "") };
    }
    function toTwos(real) {
      var n = real ? pick([22, 32]) : drillRange(3, 120);
      var P = bits(n, 8), F = bits(255 - n, 8), T = bits(256 - n, 8);
      return { prompt: "Give the 8-bit two's complement binary integer for the denary number -" + n + ".", answer: T, re: digitsRe(T),
        wrong: others(T, [P, F, bits(256 - n + 1, 8), bits(128 + n, 8)]),
        steps: ["Write " + n + " in 8-bit binary: " + P + ".", "Flip every bit: " + F + ", then add 1."],
        working: ["Start with the positive number in 8-bit binary.", "Flip every bit, then add 1."],
        note: n + " = " + P + ", flipped " + F + ", add 1: " + T + "." + (real ? " " + fromPaper(n === 22 ? "0478/12, June 2025, Question 1(g)" : "0478/12, June 2024, Question 3(d)") : "") };
    }
    function fromTwos(real) {
      var n = real ? pick([55, 73]) : drillRange(3, 120);
      var T = bits(256 - n, 8), rest = (256 - n) - 128;
      return { prompt: "Convert the two's complement 8-bit binary integer " + T + " to denary.", answer: "-" + n, re: numRe(-n),
        wrong: others("-" + n, [String(n), String(256 - n), "-" + (n + 1), "-" + (n - 1)]),
        steps: ["The leftmost bit is worth -128.", "-128 + " + rest + " = -" + n + "."],
        working: ["In two's complement the leftmost bit is worth -128.", "Add -128 to the value of the other seven bits."],
        note: "-128 + " + rest + " = -" + n + "." + (real ? " " + fromPaper(n === 55 ? "0478/13, June 2025, Question 1(d)" : "0478/12, March 2024, Question 8(b)(i)") : "") };
    }

    // ================================================================ 1.2 Text, Sound and Images
    var WORDS = ["cat", "dog", "map", "sun", "pen", "box", "key", "web", "bit", "code", "data", "file", "byte"];
    function ascii(real) {
      var word = real ? "cat" : pick(WORDS), upper = !real && Math.random() < 0.4;
      if (upper) word = word.toUpperCase();
      var known = word.charAt(0), ask;
      do { ask = word.charAt(drillRange(1, word.length - 1)); } while (ask === known);
      var k = known.charCodeAt(0), a = ask.charCodeAt(0), gap = a - k;
      return { prompt: "A text file uses the ASCII character set. One word in it is '" + word + "'. The ASCII denary value for '" + known + "' is " + k + ". Give the ASCII denary value for '" + ask + "'.",
        answer: a, re: numRe(a),
        wrong: others(a, [a + 1, a - 1, a + (upper ? 32 : -32), k + Math.abs(gap) + 2]),
        steps: ["'" + ask + "' is " + Math.abs(gap) + " letter" + (Math.abs(gap) === 1 ? "" : "s") + " " + (gap > 0 ? "after" : "before") + " '" + known + "' in the alphabet.",
          k + (gap > 0 ? " + " : " - ") + Math.abs(gap) + " = " + a + "."],
        working: ["ASCII letters are in alphabetical order, one value apart.", "Count how many letters on from the letter you know."],
        note: "'" + ask + "' is " + Math.abs(gap) + " letter" + (Math.abs(gap) === 1 ? "" : "s") + " " + (gap > 0 ? "after" : "before") + " '" + known + "': " + k + (gap > 0 ? " + " : " - ") + Math.abs(gap) + " = " + a + "." +
          (real ? " " + fromPaper("0478/13, June 2026, Question 1(c)(i)") : "") };
    }
    var TERMS = [
      { real: true, def: "measuring the height (amplitude) of a sound wave at regular time intervals", ans: "Sampling", re: "sampl(e|es|ing)",
        wrong: ["Sample rate", "Resolution", "Colour depth"], working: ["Each measurement taken from the wave is one sample.", "Name the process of taking those measurements."] },
      { def: "the number of samples taken each second", ans: "Sample rate", re: "sampl(e|ing)\\s+rate|sampling\\s+frequency",
        wrong: ["Sample resolution", "Colour depth", "Resolution"], working: ["Is it about how often, or how much detail?", "Per second means how often."] },
      { def: "the number of bits used to store each sample", ans: "Sample resolution", re: "sampl(e|ing)\\s+resolution",
        wrong: ["Sample rate", "Colour depth", "Resolution"], working: ["Is it about a sound or an image?", "Bits for each sample is how much detail every sample keeps."] },
      { def: "the number of bits used to store the colour of each pixel", ans: "Colour depth", re: "colou?r\\s+depth|bit\\s+depth",
        wrong: ["Resolution", "Sample resolution", "Sample rate"], working: ["Is it about a sound or an image?", "Bits for each pixel decide how many colours it can be."] },
      { def: "the number of pixels in an image, width by height", ans: "Resolution", re: "(image\\s+)?resolution",
        wrong: ["Colour depth", "Sample rate", "Sample resolution"], working: ["Is it about a sound or an image?", "Width by height counts pixels, not bits."] }
    ];
    function term(real) {
      var list = real ? TERMS.filter(function (t) { return t.real; }) : TERMS, t = pick(list);
      return { prompt: "Give the term for " + t.def + ".", answer: t.ans, re: wordRe(t.re), wrong: t.wrong, steps: [], working: t.working,
        note: t.ans + " is " + t.def + "." + (t.real ? " " + fromPaper("0478/13, June 2025, Question 1(e)") : "") };
    }

    // ================================================================ 1.3 Storage and File Size
    var UNIT_KINDS = [
      ["MiB", "KiB", 1024], ["GiB", "MiB", 1024], ["KiB", "bytes", 1024], ["bytes", "bits", 8], ["bytes", "nibbles", 2]
    ];
    function units(real) {
      var from, to, n, answer, steps;
      if (real) { from = "bytes"; to = "KiB"; n = 3072; answer = 3; steps = ["Going up the ladder, divide: 3072 / 1024 = 3."]; }
      else {
        var k = pick(UNIT_KINDS), up = Math.random() < 0.5, x = drillRange(2, 12);
        if (up) { from = k[1]; to = k[0]; n = x * k[2]; answer = x; steps = [n + " " + from + " / " + k[2] + " = " + x + " " + to + "."]; }
        else { from = k[0]; to = k[1]; n = x; answer = x * k[2]; steps = [x + " " + from + " x " + k[2] + " = " + answer + " " + to + "."]; }
        steps.unshift("One " + k[0].replace(/s$/, "") + " is " + k[2] + " " + k[1] + ".");
      }
      var unitRe = reEsc(to).replace(/s$/, "") + "s?";
      return { prompt: "Convert " + n + " " + from + " to " + to + ".", answer: answer, re: numRe(answer, unitRe),
        wrong: others(answer, [answer * 2, Math.round(answer / 2) || 1, answer + 1024, answer * 1000, answer - 1]),
        steps: steps,
        working: ["Find how many of the smaller unit make one of the bigger unit.", "Going to a smaller unit, multiply; going to a bigger unit, divide."],
        note: steps.join(" ") + (real ? " " + fromPaper("0478/12, June 2025, Question 2(b)(i)") : "") };
    }
    var SIDES = [50, 64, 100, 128, 150, 200, 256, 400, 512];
    function imageSize(real) {
      var w, h, depth, inBytes;
      if (real) { w = 150; h = 100; depth = 16; inBytes = false; }
      else { w = pick(SIDES); h = pick(SIDES); inBytes = Math.random() < 0.4; depth = inBytes ? pick([1, 2, 3]) : pick([8, 16, 24]); }
      var bytesPerPixel = inBytes ? depth : depth / 8, size = w * h * bytesPerPixel;
      var depthText = inBytes ? depth + " byte" + (depth > 1 ? "s" : "") : depth + " bits";
      var steps = inBytes ? [w + " x " + h + " = " + (w * h) + " pixels.", (w * h) + " x " + depth + " byte" + (depth > 1 ? "s" : "") + " = " + size + " bytes."]
        : [w + " x " + h + " x " + depth + " = " + (w * h * depth) + " bits.", (w * h * depth) + " / 8 = " + size + " bytes."];
      return { prompt: "An image is " + w + " pixels wide and " + h + " pixels high, with a colour depth of " + depthText + ". Calculate its file size in bytes.",
        answer: size, re: numRe(size, "bytes?|b"),
        wrong: others(size, [size * 8, w * h, size / 2, size * 2]),
        steps: steps,
        working: inBytes ? ["Width x height gives the number of pixels.", "The colour depth is already in bytes, so do not divide by 8."]
          : ["Width x height x colour depth gives the size in bits.", "Divide bits by 8 to get bytes."],
        note: steps.join(" ") + (real ? " " + fromPaper("0478/11, June 2022, Question 5") : "") };
    }

    // ================================================================ 1.3 Compression
    var SCENARIOS = [
      { real: "0478/11, June 2022, Question 1(a)(ii)", text: "An MP3 file is made smaller by permanently removing sound frequencies that most people cannot hear.", lossy: true },
      { real: "0478/13, June 2022, Question 6(d)", text: "A document is made smaller by indexing repeating patterns. No data is permanently removed.", lossy: false },
      { text: "A photo for a website has its resolution reduced to make the file smaller.", lossy: true },
      { text: "A sound file has its sample rate reduced to make it smaller.", lossy: true },
      { text: "An image has its colour depth reduced from 24 bits to 8 bits.", lossy: true },
      { text: "A program file is compressed so that, when decompressed, every bit is exactly the same as the original.", lossy: false },
      { text: "Runs of repeated pixels in an image are stored as a count and a colour.", lossy: false }
    ];
    function lossy(real) {
      var list = real ? SCENARIOS.filter(function (s) { return s.real; }) : SCENARIOS, s = pick(list);
      var ans = s.lossy ? "Lossy" : "Lossless";
      return { prompt: s.text + " Is this lossy or lossless compression?", answer: ans, re: wordRe(s.lossy ? "lossy(\\s+compression)?" : "lossless(\\s+compression)?"),
        wrong: [s.lossy ? "Lossless" : "Lossy", "Not compressed"], steps: [],
        working: ["Ask: is any data permanently removed?", "If the original can be rebuilt exactly, nothing was thrown away."],
        note: (s.lossy ? "Data is permanently removed, so it is lossy." : "No data is permanently removed, so it is lossless.") + (s.real ? " " + fromPaper(s.real) : "") };
    }
    function rle() {
      var letters = drillPick([["A", "B", "C"], ["X", "Y", "Z"], ["B", "W", "B"], ["W", "B", "W"], ["R", "G", "B"], ["P", "Q", "P"]]);
      var runs = letters.map(function (l) { return [drillRange(2, 7), l]; });
      var text = runs.map(function (r) { return new Array(r[0] + 1).join(r[1]); }).join("");
      var ans = runs.map(function (r) { return r[0] + r[1]; }).join(" ");
      var re = new RegExp("^\\s*" + runs.map(function (r) { return r[0] + "\\s*" + r[1]; }).join("[\\s,]*") + "\\s*$", "i");
      return { prompt: "Encode " + text + " using run length encoding (RLE). Write each run as a count then the character.", answer: ans, re: re,
        wrong: drillWrongNumbers(ans, [runs.map(function (r) { return r[1] + r[0]; }).join(" "), runs.map(function (r) { return r[0]; }).join(" "), letters.join(""),
          runs.map(function (r, i) { return (i === 1 ? r[0] + 1 : r[0]) + r[1]; }).join(" ")], 4),
        steps: ["Split it into runs of the same character: " + runs.map(function (r) { return new Array(r[0] + 1).join(r[1]); }).join(" | ") + ".", "Count each run and write the count before the character."],
        working: ["Split the data into runs of the same character.", "Write each run as its length, then the character."],
        note: "Runs of " + runs.map(function (r) { return r[0] + " " + r[1]; }).join(", ") + ": " + ans + "." };
    }

    // ================================================================ 2.1 Packets
    var ITEMS = [
      ["the destination address", "Header"], ["the originator's address", "Header"], ["the packet number", "Header"],
      ["part of the data being sent", "Payload"], ["information used to check the packet for errors", "Trailer"]
    ];
    function packetPart(real) {
      if (real) {
        return { prompt: "Which of these would not be included in a packet's header: destination address, originator's address, packet number or payload?",
          answer: "Payload", re: wordRe("payload"), wrong: ["Destination address", "Originator's address", "Packet number"], steps: [],
          working: ["Three of these are needed to deliver the packet and put it in order.", "The odd one out is what the packet is carrying."],
          note: "The payload is a separate part of the packet. " + fromPaper("0478/11, June 2025, Question 5(c)(i)") };
      }
      var it = pick(ITEMS), parts = ["Header", "Payload", "Trailer"];
      return { prompt: "Which part of a packet holds " + it[0] + "?", answer: it[1], re: wordRe(it[1].toLowerCase()),
        wrong: parts.filter(function (p) { return p !== it[1]; }), steps: [],
        working: ["A packet has three parts, in order: front, middle and end.", "Delivery details go at the front, the data in the middle and the error check at the end."],
        note: it[0].charAt(0).toUpperCase() + it[0].slice(1) + " is in the " + it[1].toLowerCase() + "." };
    }
    function switching(real) {
      var which = real ? pick(["name", "router"]) : pick(["name", "router", "order", "order", "last"]);
      if (which === "name") {
        return { prompt: "The bits of data are divided into sections that are each transmitted independently across the network. Identify the name given to these sections.",
          answer: "Packets", re: wordRe("(data\\s+)?packets?"), wrong: ["Routers", "Payloads", "Headers"], steps: [],
          working: ["It is what this whole topic is named after.", "Each section has a header, a payload and a trailer."],
          note: "The sections are packets." + (real ? " " + fromPaper("0478/13, June 2026, Question 2(a)") : "") };
      }
      if (which === "router") {
        return { prompt: "A network component controls the path taken across the network by each packet. Identify this component.",
          answer: "Router", re: wordRe("routers?"), wrong: ["Receiver", "Payload", "Monitor"], steps: [],
          working: ["It sits between networks and forwards packets.", "It chooses the route for each packet."],
          note: "A router controls the route a packet takes." + (real ? " " + fromPaper("0478/13, June 2026, Question 2(b)") : "") };
      }
      if (which === "last") {
        return { prompt: "Packets can arrive out of order. What does the receiver do once the last packet has arrived?",
          answer: "Puts the packets back in order", re: /\b(re-?order|re-?arrange|order|sequence|re-?assemble|sort)/i,
          wrong: ["Deletes the headers", "Sends every packet back", "Chooses a new route"], steps: [],
          working: ["Packets may take different routes, so they arrive jumbled.", "What does each packet number let the receiver do?"],
          note: "Once the last packet has arrived, the packets are reordered using their packet numbers." };
      }
      var count = drillRange(4, 5), order = [];
      for (var i = 1; i <= count; i++) order.push(i);
      var arrived = shuffle(order.slice());
      while (arrived.join() === order.join()) arrived = shuffle(order.slice());
      var ans = order.join(", ");
      return { prompt: "Packets arrive in the order " + arrived.join(", ") + ". Give the order the receiver uses to rebuild the file.",
        answer: ans, re: new RegExp("^\\s*" + order.join("\\s*[,>\\- ]+\\s*") + "\\s*$"),
        wrong: [arrived.join(", "), order.slice().reverse().join(", "), arrived.slice().reverse().join(", ")].filter(function (x) { return x !== ans; }), steps: [],
        working: ["The arrival order depends on the routes, not on the file.", "Each header has a packet number. Use those."],
        note: "Use the packet numbers, not the arrival order: " + ans + "." };
    }

    return [
      card("rc-convert", "rc-numbers", [toBinary, toHex, hexToBinary], true),
      card("rc-binary", "rc-numbers", [addition, shift, toTwos, fromTwos], true),
      card("rc-ascii", "rc-represent", [ascii], true),
      card("rc-term", "rc-represent", [term], false),
      card("rc-units", "rc-storage", [units], true),
      card("rc-image", "rc-storage", [imageSize], true),
      card("rc-lossy", "rc-compress", [lossy], false),
      card("rc-rle", "rc-compress", [rle], true),
      card("rc-packet", "rc-packets", [packetPart], false),
      card("rc-switching", "rc-packets", [switching], false)
    ];
  })()
});
