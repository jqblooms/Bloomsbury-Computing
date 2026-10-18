// Tests the string functions in shared/pseudocode-engine.js (syllabus 8.1 4(e)): LENGTH, SUBSTRING (first character
// is position 1, the third value is how many characters), UCASE and LCASE, with the syllabus's own examples.
//   node tools/test_pseudocode_strings.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
let failed = 0;
function out(src, vars = {}, inputs = []) {
  const r = runPseudocode(src, vars, 5000, inputs);
  if (r.error) throw new Error(`Line ${r.error.line}: ${r.error.message}\n${src}`);
  return r.outputs;
}
function err(src, vars = {}) { const r = runPseudocode(src, vars, 5000, []); return r.error ? r.error.message : null; }
function check(name, ok) { if (!ok) { failed++; console.log('FAIL ' + name); } }
function same(name, got, want) { check(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`, JSON.stringify(got) === JSON.stringify(want)); }

// The syllabus examples.
same('LENGTH("Happy Days")', out('OUTPUT LENGTH("Happy Days")'), [10]);
same('LCASE("W")', out('OUTPUT LCASE("W")'), ['w']);
same('UCASE("Happy")', out('OUTPUT UCASE("Happy")'), ['HAPPY']);
same('SUBSTRING("Happy Days", 1, 5)', out('OUTPUT SUBSTRING("Happy Days", 1, 5)'), ['Happy']);
// Start counts from 1; the third value is how many characters.
same('SUBSTRING Computer 1 3', out('OUTPUT SUBSTRING("Computer", 1, 3)'), ['Com']);
same('SUBSTRING Computer 3 5', out('OUTPUT SUBSTRING("Computer", 3, 5)'), ['mpute']);
same('last character', out('DECLARE Word : STRING\nWord <- "Mouse"\nOUTPUT SUBSTRING(Word, LENGTH(Word), 1)'), ['e']);
same('empty string', out('OUTPUT LENGTH("")'), [0]);
same('zero characters', out('OUTPUT SUBSTRING("Cat", 4, 0)'), ['']);
// Real exam answers: 0478/23 June 2026 Q6, 0478/21 June 2023 Q8, 0478/21 June 2026 Q5(b).
same('Fact program', out('DECLARE Fact : STRING\nFact <- "I learnt to program in computer science"\nOUTPUT SUBSTRING(Fact, 13, 7)'), ['program']);
same('Phrase', out('DECLARE Phrase : STRING\nPhrase <- "The beginning is the most important part"\nOUTPUT LENGTH(Phrase)\nOUTPUT UCASE(Phrase)'), [40, 'THE BEGINNING IS THE MOST IMPORTANT PART']);
same('Temp nested', out('DECLARE Temp : STRING\nTemp <- UCASE(SUBSTRING(LastName, 1, 2))\nOUTPUT Temp', { LastName: 'Hann' }), ['HA']);
// Types: LENGTH is an INTEGER, SUBSTRING of one character fits a CHAR, case-insensitive function names.
same('LENGTH into INTEGER', out('DECLARE N : INTEGER\nN <- LENGTH("abc")\nOUTPUT N + 1'), [4]);
same('CHAR from SUBSTRING', out('DECLARE C : CHAR\nC <- SUBSTRING("abc", 2, 1)\nOUTPUT C'), ['b']);
same('lower-case names', out('OUTPUT ucase(substring("abc", 1, 2))'), ['AB']);
same('in a condition', out('DECLARE A : STRING\nA <- "yes"\nIF UCASE(A) = "YES" THEN\n  OUTPUT "Match"\nENDIF'), ['Match']);
same('= is case sensitive', out('IF "yes" = "YES" THEN\n  OUTPUT "Match"\nELSE\n  OUTPUT "No match"\nENDIF'), ['No match']);
same('in a loop', out('DECLARE Word : STRING\nDECLARE Count : INTEGER\nDECLARE Total : INTEGER\nWord <- "PASTA"\nTotal <- 0\nFOR Count <- 1 TO LENGTH(Word)\n  IF SUBSTRING(Word, Count, 1) = "A" THEN\n    Total <- Total + 1\n  ENDIF\nNEXT Count\nOUTPUT Total'), [2]);
// A CHAR in single quotes, as in 0478/22 June 2023 Q11: P is "The world", Q is 'W', and the position of Q in
// UCASE(P) is 5. Without UCASE the small w never matches.
same('char literal', out("DECLARE Q : CHAR\nQ <- 'W'\nOUTPUT Q"), ['W']);
const FIND = (up) => `DECLARE P : STRING\nDECLARE Q : CHAR\nDECLARE Counter : INTEGER\nDECLARE Position : INTEGER\nP <- "The world"\nQ <- 'W'\n${up ? 'P <- UCASE(P)\n' : ''}Counter <- 1\nPosition <- 0\nWHILE Position = 0 AND Counter <= LENGTH(P) DO\n  IF SUBSTRING(P, Counter, 1) = Q THEN\n    Position <- Counter\n  ENDIF\n  Counter <- Counter + 1\nENDWHILE\nOUTPUT Position`;
same('find W with UCASE', out(FIND(true)), [5]);
same('find W without UCASE', out(FIND(false)), [0]);
// Errors.
check('unclosed char', /closing '/.test(err("OUTPUT 'W") || ''));
check('past the end', /past the end/.test(err('OUTPUT SUBSTRING("Cat", 2, 5)') || ''));
check('start 0', /position 1/.test(err('OUTPUT SUBSTRING("Cat", 0, 2)') || ''));
check('number to LENGTH', /STRING or CHAR/.test(err('OUTPUT LENGTH(25)') || ''));
check('wrong argument count', /three values/.test(err('OUTPUT SUBSTRING("Cat", 1)') || ''));
check('bare call', /does not store it or output it/.test(err('DECLARE Name : STRING\nName <- "sam"\nUCASE(Name)\nOUTPUT Name') || ''));
check('UCASE leaves the variable alone', JSON.stringify(out('DECLARE Name : STRING\nDECLARE Big : STRING\nName <- "sam"\nBig <- UCASE(Name)\nOUTPUT Name')) === '["sam"]');
check('STRING result into INTEGER fails', /INTEGER/.test(err('DECLARE N : INTEGER\nN <- UCASE("a")') || ''));
// Existing behaviour is unchanged: a variable called Length, DIV and MOD forms, & joins.
same('variable named Length', out('DECLARE Length : INTEGER\nLength <- 4\nOUTPUT Length * 2'), [8]);
same('DIV form', out('OUTPUT DIV(17, 5)'), [3]);
same('concatenation', out('OUTPUT "a" & "b"'), ['ab']);

console.log(failed ? `${failed} failed` : 'All string tests passed.');
process.exit(failed ? 1 : 0);
