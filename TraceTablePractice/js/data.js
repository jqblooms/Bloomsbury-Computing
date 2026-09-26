// The algorithms: walkthroughs and fixed practice questions, in Python and Cambridge pseudocode.
// ======================================================
// CONSTANTS & DATA (Python)
// ======================================================
const EXTRA_ROWS = 2;
const CODE_LANGUAGE_KEY = 'traceTableCodeLanguage_v1';
let currentCodeLanguage = localStorage.getItem(CODE_LANGUAGE_KEY) === 'cambridge' ? 'cambridge' : 'python';

// "trace" (default): code is shown, student fills in the trace table.
// "code": the trace table is shown (read-only, already correct), student
// writes the pseudocode/Python that produces it in a line-numbered editor.
const PRACTICE_MODE_KEY = 'traceTablePracticeMode_v1';
let currentPracticeMode = localStorage.getItem(PRACTICE_MODE_KEY) === 'code' ? 'code' : 'trace';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

// Algorithm 0: For Loop Accumulator
const algo0Context = "The user ran the program and typed <strong>3</strong> when prompted for the limit.";
const algo0Lines = [
  "limit = int(input(\"Enter limit:\"))",
  "total = 0",
  "for i in range(1, limit + 1):",
  "    total = total + i",
  "print(total)"
];
const algo0Cols = ['Line', 'limit', 'total', 'i', 'Output'];
const algo0Answers = [
  {Line: '1', limit: '3', total: '', i: '', Output: ''},
  {Line: '2', limit: '', total: '0', i: '', Output: ''},
  {Line: '3', limit: '', total: '', i: '1', Output: ''},
  {Line: '4', limit: '', total: '1', i: '', Output: ''},
  {Line: '3', limit: '', total: '', i: '2', Output: ''},
  {Line: '4', limit: '', total: '3', i: '', Output: ''},
  {Line: '3', limit: '', total: '', i: '3', Output: ''},
  {Line: '4', limit: '', total: '6', i: '', Output: ''},
  {Line: '5', limit: '', total: '', i: '', Output: '6'}
];

// Algorithm 1: While Loop Countdown
const algo1Context = "The program asks the user for a starting number, and they type <strong>10</strong>.";
const algo1Lines = [
  "x = int(input(\"Enter start number:\"))",
  "while x > 5:",
  "    print(x)",
  "    x = x - 2",
  "print(\"Done\")"
];
const algo1Cols = ['Line', 'x', 'Output'];
const algo1Answers = [
  {Line: '1', x: '10', Output: ''},
  {Line: '3', x: '', Output: '10'},
  {Line: '4', x: '8', Output: ''},
  {Line: '3', x: '', Output: '8'},
  {Line: '4', x: '6', Output: ''},
  {Line: '3', x: '', Output: '6'},
  {Line: '4', x: '4', Output: ''},
  {Line: '5', x: '', Output: 'Done'}
];

// Algorithm 2: Conditional Inside Loop
const algo2Context = "When prompted for a base value, the user enters <strong>5</strong>.";
const algo2Lines = [
  "x = int(input(\"Enter base value:\"))",
  "for i in range(1, 4):",
  "    if i > 1:",
  "        x = x + i",
  "print(x)"
];
const algo2Cols = ['Line', 'x', 'i', 'Output'];
const algo2Answers = [
  {Line: '1', x: '5', i: '', Output: ''},
  {Line: '2', x: '', i: '1', Output: ''},
  {Line: '2', x: '', i: '2', Output: ''},
  {Line: '4', x: '7', i: '', Output: ''},
  {Line: '2', x: '', i: '3', Output: ''},
  {Line: '4', x: '10', i: '', Output: ''},
  {Line: '5', x: '', i: '', Output: '10'}
];

// Algorithm 3: Do...Until Loop (Python has no do-until, written as while True: with a break)
const algo3Context = "The user ran the program and entered <strong>3</strong> when prompted for a start number.";
const algo3Lines = [
  "start = int(input(\"Enter start:\"))",
  "while True:",
  "    print(start)",
  "    start = start - 1",
  "    if start == -1:",
  "        break",
  "print(\"Finished\")"
];
const algo3Cols = ['Line', 'start', 'Output'];
const algo3Answers = [
  {Line: '1', start: '3', Output: ''},
  {Line: '3', start: '', Output: '3'},
  {Line: '4', start: '2', Output: ''},
  {Line: '3', start: '', Output: '2'},
  {Line: '4', start: '1', Output: ''},
  {Line: '3', start: '', Output: '1'},
  {Line: '4', start: '0', Output: ''},
  {Line: '3', start: '', Output: '0'},
  {Line: '4', start: '-1', Output: ''},
  {Line: '7', start: '', Output: 'Finished'}
];

// Algorithm 4: Arrays
const algo4Context = "The program processes an array pre-defined as: <strong>actNumbers = [4, 7, 2]</strong>.";
const algo4Lines = [
  "count = 0",
  "for x in range(0, 3):",
  "    count = count + actNumbers[x]",
  "print(count)"
];
const algo4Cols = ['Line', 'count', 'x', 'Output'];
const algo4Answers = [
  {Line: '1', count: '0', x: '', Output: ''},
  {Line: '2', count: '', x: '0', Output: ''},
  {Line: '3', count: '4', x: '', Output: ''},
  {Line: '2', count: '', x: '1', Output: ''},
  {Line: '3', count: '11', x: '', Output: ''},
  {Line: '2', count: '', x: '2', Output: ''},
  {Line: '3', count: '13', x: '', Output: ''},
  {Line: '4', count: '', x: '', Output: '13'}
];

// Algorithm 5: Sequence foundations. The walkthrough and independent
// practice use different values so students must follow each update.
const sequenceWalkData = {
  context: 'The user enters <strong>4</strong>. Follow each instruction in order and record the new value only when it changes.',
  code: [
    'number = int(input("Enter a number:"))',
    'number = number + 3',
    'number = number * 2',
    'print(number)'
  ],
  cols: ['Line', 'number', 'Output'],
  answers: [
    {Line: '1', number: '4', Output: ''},
    {Line: '2', number: '7', Output: ''},
    {Line: '3', number: '14', Output: ''},
    {Line: '4', number: '', Output: '14'}
  ]
};

const sequencePracticeData = {
  title: 'Sequence Foundations',
  context: 'The user enters <strong>6</strong>. Complete the table by following the instructions from top to bottom.',
  code: [
    'number = int(input("Enter a number:"))',
    'number = number - 2',
    'number = number * 3',
    'print(number)'
  ],
  cols: ['Line', 'number', 'Output'],
  answers: [
    {Line: '1', number: '6', Output: ''},
    {Line: '2', number: '4', Output: ''},
    {Line: '3', number: '12', Output: ''},
    {Line: '4', number: '', Output: '12'}
  ]
};

const selectionWalkData = {
  context: 'When prompted for a score, the user enters <strong>8</strong>. Record the input, test the condition, then follow only the branch that runs.',
  code: [
    'score = int(input("Enter score:"))',
    'if score >= 5:',
    '    result = 1',
    'else:',
    '    result = 0',
    'print(result)'
  ],
  cols: ['Line', 'score', 'result', 'Output'],
  answers: [
    {Line: '1', score: '8', result: '', Output: ''},
    {Line: '3', score: '', result: '1', Output: ''},
    {Line: '6', score: '', result: '', Output: '1'}
  ]
};

const selectionPracticeData = {
  title: 'Selection Foundations',
  context: 'When prompted for a score, the user enters <strong>3</strong>. Record the input, test the condition, then trace only the branch that runs.',
  code: [
    'score = int(input("Enter score:"))',
    'if score >= 5:',
    '    result = 1',
    'else:',
    '    result = 0',
    'print(result)'
  ],
  cols: ['Line', 'score', 'result', 'Output'],
  answers: [
    {Line: '1', score: '3', result: '', Output: ''},
    {Line: '5', score: '', result: '0', Output: ''},
    {Line: '6', score: '', result: '', Output: '0'}
  ]
};

const pracData = [
  { context: algo0Context, code: algo0Lines, cols: algo0Cols, answers: algo0Answers },
  { context: algo1Context, code: algo1Lines, cols: algo1Cols, answers: algo1Answers },
  { context: algo2Context, code: algo2Lines, cols: algo2Cols, answers: algo2Answers },
  { context: algo3Context, code: algo3Lines, cols: algo3Cols, answers: algo3Answers },
  { context: algo4Context, code: algo4Lines, cols: algo4Cols, answers: algo4Answers },
  sequencePracticeData,
  selectionPracticeData
];

const walkData = pracData.slice();
walkData[5] = sequenceWalkData;
walkData[2] = selectionWalkData;
