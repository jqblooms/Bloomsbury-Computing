// Tests shared/acsl-pseudocode.js, the ACSL "What Does This Program Do?" interpreter.
//   node tools/test_acsl_pseudocode.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'acsl-pseudocode.js'));
let passed = 0, failed = 0;
function same(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) passed++; else { failed++; console.log(`FAIL ${name}\n  got  ${g}\n  want ${w}`); }
}
const out = (src, inputs) => { const r = A.run(src, { inputs }); return r.error ? 'ERROR line ' + r.error.line + ': ' + r.error.message : r.outputs; };
const err = (src) => { const r = A.run(src); return r.error ? r.error.message : 'no error'; };
const ev = (e, v) => A.format(A.evalExpr(e, v));

// Operators and precedence.
same('real division', ev('7 / 2'), '3.5');
same('modulus', ev('17 % 5'), '2');
same('int floors', ev('int(7 / 2)'), '3');
same('int of a negative floors', ev('int(-3.5)'), '-4');
same('power', ev('2 ^ 5'), '32');
same('up arrow', ev('2 ↑ 3'), '8');
same('power is right to left', ev('2 ^ 3 ^ 2'), '512');
same('power before times', ev('3 * 2 ^ 2'), '12');
same('times before plus', ev('2 + 3 * 4'), '14');
same('left to right', ev('20 / 4 * 5'), '25');
same('mod and times level', ev('17 % 5 * 3'), '6');
same('minus left to right', ev('10 - 4 - 3'), '3');
same('brackets', ev('(2 + 3) * 4'), '20');
same('comparison after arithmetic', ev('2 + 3 == 5'), 'TRUE');
same('!=', ev('7 != 7'), 'FALSE');
same('&& and ||', ev('3 > 2 && 4 < 1 || 5 == 5'), 'TRUE');
same('! first', ev('!(3 > 2)'), 'FALSE');
same('abs', ev('abs(3 - 10)'), '7');
same('sqrt', ev('sqrt(49) + 1'), '8');
same('decimal tidy', ev('0.1 + 0.2'), '0.3');
same('divisibility idiom true', ev('x / k == int(x / k)', { x: 12, k: 3 }), 'TRUE');
same('divisibility idiom false', ev('x / k == int(x / k)', { x: 12, k: 5 }), 'FALSE');
same('case-insensitive names', ev('Total + total', { TOTAL: 4 }), '8');

// Statements.
same('colon separators', out('a = 5 : b = a * 2 : OUTPUT a + b'), ['15']);
same('FOR sum', out('s = 0\nFOR i = 1 TO 5\n  s = s + i\nNEXT i\nOUTPUT s'), ['15']);
same('FOR STEP 2', out('s = 0\nFOR i = 1 TO 9 STEP 2\n s = s + i\nNEXT i\nOUTPUT s'), ['25']);
same('FOR STEP -1', out('t = ""\nFOR i = 5 TO 1 STEP -1\n t = t + i\nNEXT i\nOUTPUT t'), ['54321']);
same('FOR STEP -3', out('c = 0\nFOR i = 20 TO 1 STEP -3\n c = c + 1\nNEXT i\nOUTPUT c, i'), ['7 -1']);
same('FOR never runs', out('c = 0\nFOR i = 5 TO 1\n c = c + 1\nNEXT i\nOUTPUT c'), ['0']);
same('FOR bounds fixed once', out('n = 3 : c = 0\nFOR i = 1 TO n\n n = n + 1 : c = c + 1\nNEXT i\nOUTPUT c'), ['3']);
same('NEXT without variable', out('s = 0\nfor i = 1 to 3\ns = s + i\nnext\noutput s'), ['6']);
same('lower-case keywords', out('x = 2\nwhile x < 50\n x = x * 3\nend while\noutput x'), ['54']);
same('WHILE never runs', out('x = 10\nWHILE x < 5\n x = x + 1\nEND WHILE\nOUTPUT x'), ['10']);
same('IF ELSE', out('FOR i = 1 TO 4\n IF i % 2 == 0 THEN\n  OUTPUT "even"\n ELSE\n  OUTPUT i\n END IF\nNEXT i'), ['1', 'even', '3', 'even']);
same('IF on one line with colons', out('a = 7 : IF a > 5 THEN b = 1 : ELSE b = 2 : END IF : OUTPUT b'), ['1']);
same('ENDIF and ENDWHILE spelt together', out('a = 0\nWHILE a < 3\n IF a == 1 THEN\n  OUTPUT a\n ENDIF\n a = a + 1\nENDWHILE'), ['1']);
same('INPUT', out('INPUT a, b\nOUTPUT a * b', [6, 7]), ['42']);
same('END stops', out('OUTPUT 1\nEND\nOUTPUT 2'), ['1']);
same('nested loops', out('c = 0\nFOR i = 1 TO 3\n FOR j = 1 TO 4\n  c = c + 1\n NEXT j\nNEXT i\nOUTPUT c'), ['12']);
same('real output', out('OUTPUT 10 / 4'), ['2.5']);

// The logic of the ACSL sample (a nested loop builds a sum of squares, then a loop counts its factors with the
// divisibility idiom). Written fresh here: 1 + 4 + 9 + ... + 49 = 140, and 140 has 12 factors.
const SAMPLE = [
  'a = 0',
  'FOR i = 1 TO 7',
  '  FOR j = 1 TO i',
  '    a = a + i',
  '  NEXT j',
  'NEXT i',
  'c = 0',
  'FOR k = 1 TO a',
  '  IF a / k == int(a / k) THEN c = c + 1',
  '  END IF',
  'NEXT k',
  'OUTPUT c'].join('\n');
same('sum of squares then factor count', out(SAMPLE), ['12']);
same('sum of squares value', A.run(SAMPLE).vars.a, 140);

// Errors.
same('= in a condition', err('a = 1\nIF a = 1 THEN\n OUTPUT a\nEND IF'), 'Use == to compare. A single = stores a value.');
same('no value yet', err('OUTPUT b + 1'), 'b has no value yet.');
same('missing NEXT', err('FOR i = 1 TO 3\n OUTPUT i'), 'FOR i has no NEXT.');
same('NEXT mismatch', err('FOR i = 1 TO 3\nNEXT j'), 'NEXT j does not match FOR i.');
same('missing END IF', err('IF 1 > 0 THEN\n OUTPUT 1'), 'IF has no END IF.');
same('stuck loop', err('x = 1\nWHILE x > 0\n x = x + 1\nEND WHILE'), 'The program ran too many steps. Is a loop stuck?');
same('STEP 0', err('FOR i = 1 TO 3 STEP 0\nNEXT i'), 'STEP 0 never ends.');
same('division by zero', err('OUTPUT 3 / 0'), 'Division by zero.');
same('error line number', A.run('a = 1\nb = 2\nc = d').error.line, 3);

// Trace events.
const t = A.run('s = 0\nFOR i = 1 TO 2\n s = s + i\nNEXT i\nOUTPUT s', { trace: true }).events;
same('trace events', t.map((e) => e.type === 'output' ? 'out ' + e.value : `${e.name}=${e.value}${e.final ? ' final' : ''} L${e.line}`),
  ['s=0 L1', 'i=1 L2', 's=1 L3', 'i=2 L2', 's=3 L3', 'i=3 final L2', 'out 3']);

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
