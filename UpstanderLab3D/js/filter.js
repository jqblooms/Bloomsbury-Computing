// The class chat's "nice chat" filter, written by Niran in coding club. The same rule as the pseudocode he shows:
// a message is flagged when any blocked word is somewhere inside the message in capitals (UCASE). Plain module so
// tools/test_upstander.mjs can check every message's result in Node.
export const BLOCKED = ['LOSER', 'UGLY', 'STUPID', 'WEIRDO'];

export function flagged(message, list = BLOCKED) {
  const u = String(message).toUpperCase();
  return list.some((w) => u.includes(w));
}

// What a tester says about one result: the filter was right, raised a false alarm, or missed an unkind message.
export function verdict(isFlagged, unkind) {
  if (isFlagged === unkind) return 'right';
  return isFlagged ? 'false-alarm' : 'missed';
}

export const CODE = [
  'DECLARE Blocked : ARRAY[1:4] OF STRING',
  'Blocked ← ["LOSER", "UGLY", "STUPID", "WEIRDO"]',
  '',
  'FUNCTION Flag(Message : STRING) RETURNS BOOLEAN',
  '    DECLARE i : INTEGER',
  '    FOR i ← 1 TO 4',
  '        IF CONTAINS(UCASE(Message), Blocked[i]) THEN',
  '            RETURN TRUE',
  '        ENDIF',
  '    NEXT i',
  '    RETURN FALSE',
  'ENDFUNCTION',
].join('\n');
