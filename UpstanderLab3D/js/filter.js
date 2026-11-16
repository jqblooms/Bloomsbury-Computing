// The class chat app's banned-word filter: a message is hidden when any banned word is somewhere inside it, in any
// mix of capitals. Plain module so tools/test_upstander.mjs can check every message's result in Node.
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
