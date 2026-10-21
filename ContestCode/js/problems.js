// Contest Code problems: original programming problems in the style of the ACSL Junior Contest 2 programming problem.
// Each problem reads one line of input and prints five answers, one per line. A test is one input; the expected
// lines come from the problem's own solve() here, never typed by hand. tests[0] is the sample the student can see.
var CC_PROBLEMS = (function () {
  'use strict';
  var VOWELS = 'aeiou';
  function isVowel(ch) { return VOWELS.indexOf(String(ch).toLowerCase()) >= 0; }
  function words(line) { return line.trim().split(/\s+/).filter(Boolean); }
  function factors(n) { var c = 0; for (var k = 1; k <= n; k++) if (n % k === 0) c++; return c; }

  return [
    {
      id: 'word-stats', contest: 'c2', title: 'Word Stats',
      story: 'A school magazine checks every headline before it is printed. Write a program that reads a headline and reports five facts about its words.',
      input: 'One line: words made of letters only, with one space between words.',
      outputs: [
        'The number of words.',
        'The number of words that start with a vowel (a, e, i, o or u, capital or small).',
        'The number of letters in the shortest word.',
        'The word with the most vowels, as it appears in the line. If two or more words tie, print the one that comes first.',
        'The number of words that have a double letter: the same letter twice in a row, ignoring case (like "ll" in "hello").'
      ],
      tests: [
        'Our school library opens at eight every morning',
        'A huge green balloon floated over the old mill',
        'Eleven students cooked noodles in the school kitchen',
        'I see Anna',
        'Bloomsbury pupils love coding puzzles and keep scoring well'
      ],
      solve: function (line) {
        var w = words(line);
        var vowelsIn = function (x) { return x.split('').filter(isVowel).length; };
        var most = w[0];
        w.forEach(function (x) { if (vowelsIn(x) > vowelsIn(most)) most = x; });
        return [
          w.length,
          w.filter(function (x) { return isVowel(x[0]); }).length,
          Math.min.apply(null, w.map(function (x) { return x.length; })),
          most,
          w.filter(function (x) { return /(.)\1/i.test(x); }).length
        ].map(String);
      }
    },
    {
      id: 'number-line', contest: 'c2', title: 'Number Line',
      story: 'A number game shows a row of numbers on the board. Write a program that reads the row and reports five facts about it.',
      input: 'One line: positive whole numbers up to 1000, with one space between numbers.',
      outputs: [
        'The total of all the numbers.',
        'How many of the numbers are even.',
        'The total of all the digits of all the numbers (in 25 7 the digits are 2, 5 and 7).',
        'The number that has the most factors. If two or more numbers tie, print the smallest of them.',
        'The largest number minus the smallest number.'
      ],
      tests: [
        '12 7 30 9 16',
        '5 3 11 2',
        '100 64 36 81 49 90',
        '6 8 10 14 15',
        '997 1000 512 360 7'
      ],
      solve: function (line) {
        var n = words(line).map(Number);
        var best = n[0];
        n.forEach(function (x) { var a = factors(x), b = factors(best); if (a > b || (a === b && x < best)) best = x; });
        return [
          n.reduce(function (a, b) { return a + b; }, 0),
          n.filter(function (x) { return x % 2 === 0; }).length,
          n.join('').split('').reduce(function (a, d) { return a + Number(d); }, 0),
          best,
          Math.max.apply(null, n) - Math.min.apply(null, n)
        ].map(String);
      }
    },
    {
      id: 'code-words', contest: 'c2', title: 'Code Words',
      story: 'A spy club turns words into codes. Write a program that reads one word and prints five codes made from it.',
      input: 'One word made of letters only (capital or small).',
      outputs: [
        'The word backwards.',
        'The word with every vowel (a, e, i, o, u, capital or small) taken out. The other letters keep their case.',
        'How many letters come before the first vowel. If there is no vowel, print the length of the word.',
        'The word in capital letters with each letter moved one place on in the alphabet (Z becomes A).',
        'The total of the letters\' places in the alphabet, ignoring case (A is 1, B is 2, up to Z is 26).'
      ],
      tests: [
        'Planet',
        'Zebra',
        'rhythm',
        'Strawberry',
        'Apple'
      ],
      solve: function (line) {
        var w = line.trim();
        var first = -1;
        for (var i = 0; i < w.length; i++) if (isVowel(w[i])) { first = i; break; }
        return [
          w.split('').reverse().join(''),
          w.split('').filter(function (c) { return !isVowel(c); }).join(''),
          first < 0 ? w.length : first,
          w.toUpperCase().split('').map(function (c) { return c === 'Z' ? 'A' : String.fromCharCode(c.charCodeAt(0) + 1); }).join(''),
          w.toUpperCase().split('').reduce(function (a, c) { return a + c.charCodeAt(0) - 64; }, 0)
        ].map(String);
      }
    }
  ];
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CC_PROBLEMS;
