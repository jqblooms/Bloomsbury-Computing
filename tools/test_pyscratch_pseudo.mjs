// Checks the PyScratch pseudocode translator (assets/js/pyscratch-pseudo.js):
// good Cambridge pseudocode turns into Python, and common mistakes give the
// right message on the right line. Run: node tools/test_pyscratch_pseudo.mjs
// (the running behaviour itself is tested in the editor with ?pstest=1).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const P = require('../assets/js/pyscratch-pseudo.js');

let failures = 0;
function check(label, cond, detail) {
  if (!cond) { failures++; console.log('FAIL ' + label + (detail ? ': ' + detail : '')); }
}
function errorOf(src) {
  const r = P.transpile(src);
  return r.errors[0] || null;
}
function python(src) {
  const r = P.transpile(src);
  if (r.errors.length) throw new Error('unexpected error: ' + JSON.stringify(r.errors[0]));
  return r.python.map(l => l.text).join('\n');
}

// ── Good pseudocode ──
const game = python(`DECLARE Score : INTEGER
CONSTANT Speed <- 5
PROCEDURE GameStart()
    WHILE TRUE DO
        IF KeyPressed("right")
          THEN
            CALL ChangeX(Speed)
          ELSE
            CALL Say("Score: " & Score)
        ENDIF
    ENDWHILE
ENDPROCEDURE
PROCEDURE WhenKeyPressed(Key : STRING)
    CASE OF Key
        "space" : Score <- Score + 1
        OTHERWISE : CALL Say(Key)
    ENDCASE
ENDPROCEDURE`);
check('WHILE TRUE becomes a forever loop', /while True:/.test(game));
check('procedure is defined', /def p_GameStart\(\):/.test(game));
check('event alias', /game_start = p_GameStart/.test(game) && /when_key_pressed = p_WhenKeyPressed/.test(game));
check('global line for Score', /global v_Score/.test(game));
check('& joins text', /_ps_cat\("Score: ", v_Score\)/.test(game));
check('CASE becomes if', /if _ps_case1 == "space":/.test(game));

const main = python(`DECLARE Count : INTEGER
DECLARE Names : ARRAY[1:3] OF STRING
FOR Count <- 10 TO 1 STEP -3
    OUTPUT Count
NEXT Count
REPEAT
    Count <- Count + 1
UNTIL Count = 5
Names[1] <- SUBSTRING("Hello", 1, 3)`);
check('top-level code runs as main', /def _ps_main\(\):/.test(main));
check('FOR with STEP', /_ps_range\(10, 1, \(-3\), "Count", 3\)/.test(main));
check('REPEAT runs at full speed (while 1)', /while 1:/.test(main));
check('array element is type-checked', /v_Names\[1\] = _ps_chk\(_ps_substring\("Hello", 1, 3\), "STRING"/.test(main));

// Lines map back to the pseudocode
const mapped = P.transpile('DECLARE X : INTEGER\n\nX <- 5').python;
check('line numbers map back', mapped.some(l => l.src === 3 && /v_X = _ps_chk/.test(l.text)));

// ── Mistakes ──
const cases = [
  ['undeclared variable', 'PROCEDURE GameStart()\n    X <- 5\nENDPROCEDURE', 2, /X has not been declared/],
  ['lower-case keyword', 'PROCEDURE GameStart()\n    if TRUE THEN\n    ENDIF\nENDPROCEDURE', 2, /capitals.*IF/],
  ['missing CALL', 'PROCEDURE GameStart()\n    MoveSteps(10)\nENDPROCEDURE', 2, /CALL MoveSteps/],
  ['Python name', 'CALL move_steps(10)', 1, /Did you mean MoveSteps/],
  ['near-miss name', 'CALL MoveStep(10)', 1, /Did you mean MoveSteps/],
  ['= for assignment', 'DECLARE X : INTEGER\nX = 5', 2, /Use <- to store a value/],
  ['missing ENDIF', 'PROCEDURE GameStart()\n    IF TRUE THEN\n        CALL Hide()\nENDPROCEDURE', 4, /needs ENDIF/],
  ['missing THEN', 'IF 1 = 1\n    CALL Hide()\nENDIF', 1, /write THEN/],
  ['function with CALL', 'FUNCTION F() RETURNS INTEGER\n    RETURN 1\nENDFUNCTION\nCALL F()', 4, /is a FUNCTION/],
  ['event spelt wrong (case)', 'PROCEDURE gamestart()\nENDPROCEDURE', 1, /written GameStart/],
  ['event spelt wrong (typo)', 'PROCEDURE GameStrat()\nENDPROCEDURE', 1, /spelt GameStart/],
  ['wrong number of values', 'CALL GoToXY(1)', 1, /needs 2 values/],
  ['PRINT', 'PRINT "x"', 1, /OUTPUT, not PRINT/],
  ['REAL loop counter', 'DECLARE C : REAL\nFOR C <- 1 TO 3\nNEXT C', 2, /must be declared as an INTEGER/],
  ['NEXT does not match', 'DECLARE C : INTEGER\nFOR C <- 1 TO 3\nNEXT D', 3, /does not match FOR C/],
  ['function without brackets', 'DECLARE X : INTEGER\nX <- XPosition', 2, /needs brackets/],
  ['chained comparison', 'DECLARE X : INTEGER\nIF 1 < X < 5 THEN\nENDIF', 2, /Compare two things/],
  ['changing a CONSTANT', 'CONSTANT A <- 5\nA <- 6', 2, /CONSTANT/],
  ['text in single quotes', "DECLARE S : STRING\nS <- 'hello'", 2, /Single quotes/],
  ['ELIF', 'DECLARE X : INTEGER\nIF X = 1 THEN\nELIF X = 2 THEN\nENDIF', 3, /Write ELSE/],
  ['procedure inside a procedure', 'PROCEDURE A()\nPROCEDURE B()\nENDPROCEDURE\nENDPROCEDURE', 2, /left edge/],
  ['event parameters', 'PROCEDURE WhenKeyPressed()\nENDPROCEDURE', 1, /WhenKeyPressed\(Key : STRING\)/],
  ['own procedure named like a command', 'PROCEDURE Show()\nENDPROCEDURE', 1, /already a PyScratch procedure/]
];
for (const [label, src, line, re] of cases) {
  const e = errorOf(src);
  check(label, e && e.line === line && re.test(e.message), e ? 'line ' + e.line + ': ' + e.message : 'no error');
}

// The prologue defines every command the translator can call
const pro = P.prologue();
P.API.forEach(a => check('prologue defines ' + a.n, new RegExp('def ' + a.n + '\\(').test(pro)));

console.log(failures ? failures + ' failure(s)' : 'All pseudocode translator checks passed.');
process.exit(failures ? 1 : 0);
