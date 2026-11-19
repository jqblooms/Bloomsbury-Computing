# TowerDefence: embed and question contract

Folder: `TowerDefence/` (entry `TowerDefence/index.html`). Lesson slide embeds it as
`TowerDefence/index.html?embed=1&set=twos-complement&bcv=<build>` on the Y11 lesson `y11-1-9-defence` (slide `game`; shell registry id `tower-defence`, iframeSrc `TowerDefence/index.html?bcv=...`, the slide adds `&embed=1&set=twos-complement`).

## Questions come from the shell, never from the game

Load the client (answers and mark schemes stay on the server):

```html
<script src="../shared/exam-game-client.js?v=20261119eqa"></script>
<script src="../shared/exam-question.js?v=20261119eqa"></script>
```

All calls return Promises.

- `ExamGame.sets()` -> `[{ setId, title, count }]`
- `ExamGame.next(setId, { count, maxMarks })` -> `[{ qid, text, marks, blocks? }]`
  - `count`: how many questions (default 1, max 10). `maxMarks`: skip questions worth more than this.
  - No repeats for a student until they have seen the whole pool, then their weakest come first.
  - `text` is plain text with `\n` line breaks (show it in a `white-space: pre-wrap` box).
  - `blocks` (on most questions): the question as the exam draws it (tables, truth tables, gate symbols, registers,
    binary sums in columns, code, tick-box options). Show the question with
    `BCExamQuestion.render(el, { text, blocks })`: it draws the blocks, or the plain text when there are none. Keep
    `blocks` with the round you save; `ExamGame.blocksFor(qid)` finds them for an older saved round once the file has loaded.
- `ExamGame.submit(qid, answer, attempt, image)` -> `{ marks, max, feedback, canRetry, attempt, full }`
  - `answer`: the student's working and answer, typed in ONE text box (textarea). Required: the final answer mark comes only from this text.
  - `image` (optional): pen working as a base64 PNG string WITHOUT the `data:` prefix, or `''`. Haiku sees it with the text and gives working marks for it; the keyword fallback ignores it.
    - Before sending: crop to the drawn area plus about 16px margin, downscale so the longest side is at most 800px, black strokes on white. Send `''` for a blank canvas.
    - The server ignores an image over 400000 base64 characters, or one that is not a PNG, and marks the text alone. The Exam Game log shows `Image: yes` when one was used.
  - `attempt`: 1 or 2. Only one second attempt is allowed, and only when `canRetry` was true.
  - `feedback`: plain English; on a part-marked answer it explains what earns the marks without the final answer.
  - The game pays half for a second-attempt mark (`attempt === 2`).
  - Marking takes a few seconds (AI). Show a "Marking..." state; never block the game loop on it.
- `ExamGame.submitMany([{ qid, answer, attempt, image }])` -> `[result | { qid, error }]`
  - A whole round in ONE request (op `submitMany`); the server sends the Haiku calls together (`UrlFetchApp.fetchAll`),
    retries a failed one once, then uses the keyword fallback for that answer. Each result is a `submit` result plus
    its `qid`, in the same order, or that answer's own `error`. Same rules per answer as `submit` (caps, second tries, half pay).
  - Limits: 10 answers, each image at most 400000 base64 characters and 1200000 in all.
  - A shell without the op answers "Unknown request."; the client then sends one `submit` per answer.
  - Circuit Siege shows the whole round on one page and sends it with this (James 2026-11-18).
- Resends are safe: give each send of an answer an id (`rid`, from `ExamGame.newRid()`) as the 5th argument of `submit` or
  in each `submitMany` item, and keep it until a mark comes back. Both calls retry by themselves after about 2 s and 5 s;
  the server answers a send with a rid it already marked with the stored result (no new attempt, slot or second try).
  When they still fail, keep every answer and offer a big "Send again" (skip only as a small text button).
  Stub: `?examStubFail=N` or `ExamGame.stubFail(N)` makes the next N submit requests fail like a network error.
- `ExamGame.isStub()` says whether the local stub is in use; `ExamGame.useStub(true)` forces it.
- Errors reject with an `Error` whose message is safe to show ("Sign in to play", "No answer from the site...").

## Answering in the exam's own spaces (James 2026-11-19)

Every question is written exactly as on the Cambridge paper, and students answer the way the paper does. Mount a
question with `BCExamQuestion.answerUI(qEl, ansEl, { text, blocks }, opts)` (shared/exam-question.js): it draws the
blocks with their answer spaces live and returns the answer box API (`text()`, `doc()`, `state()`, `setReadOnly(b)`,
`focus()`). Keep `state()` with the saved round so a reload keeps the ticks and cells.

- `tickGrid` and `options`: click a box to tick it (click again to untick).
- Blank truth table cells, empty register boxes, the carry row and answer boxes of a sum: type 0 or 1 (the cursor moves on).
- A blank table cell, and a `line` ("Logic gate ........"): type a value.
- A `lines` block (answer lines for working or explanations): the typing box (shared/answer-box.js) is mounted there.
  A question with nothing to fill in gets the typing box in `ansEl`. Otherwise `ansEl` (and `opts.labelEl`) are hidden.

`text()` is the answer sent to `submit`/`submitMany`: plain text, one line per answer space in block order, joined by
`\n`. A space with nothing filled in writes no line. Exactly:

| Space | Line(s) sent |
| --- | --- |
| tickGrid | Every row, once anything in the grid is ticked: `Row 1: AND, OR.` then `Row 2: none.` (the ticked column heads, left to right, joined by `, `; `none` when the row has no tick; rows numbered from 1) |
| options | One line per ticked box: `Option C: truth table.` |
| truthTable | One line per output column that has a blank: `X: 0001` (the whole column, top row first; a printed cell gives its own value; a blank left empty is `?`) |
| register (empty) | `Register: 10110010` (the caption without its colon, else `Register`; an empty box is `?`) |
| table blank cell | `<first cell of its row>: <value>`, e.g. `00100011: 35`; when the blank is in the first column, `<column head>, row n: <value>` |
| sum | `Carry: 01100110` (an empty carry box is `0`) and `Answer: 10011001` (an empty box is `?`) |
| line | `<label>: <value>` (an empty label is written `Answer`) |
| lines | The typed text, as typed, at the place of the lines block (with no lines block, typed text comes first) |

Example, 0478/12 March 2022 Q3(a): `Row 1: AND, OR.\nRow 2: none.\nRow 3: OR.` earns 3 marks.

Marking reads that text (ExamGame.gs): Haiku against the mark scheme, or for `markBy: 'key'` questions and as the
fallback, the keyword `points` plus the question's `key`, both plain JSON:
- `{ grid: [['AND','OR'], [], ['OR']], scale? }`: finds every `Row n: ...` (on its own line or several on one line,
  ending at `.` or a line break), splits the ticks on `,`, trims, uppercases, compares as a set to row n of the grid
  (`none` is the empty set). The count of right rows is the marks, or goes through `scale`.
- `{ label: 'W', value: '00100000' | ['OR', 'OR gate'], scale?, marks? }`: the LAST line whose text, with all
  whitespace removed and lowercased, starts with the label (whitespace removed, lowercased) plus `:`. The rest is the
  value (same normalising). A list `value`: any match earns `marks` (default 1). With `scale`: count the positions where
  value and the answer agree (only when both have the same length). Otherwise an exact match earns `marks` (default 1).
- `scale`: `[[min, marks], ...]`, largest `min` first; the first `min` the count reaches gives the marks, else 0.
- Total = points met + key marks, capped at the question's marks. `markBy: 'key'` means no Haiku for that question.
- `adaptNote` is for teachers and docs only and never reaches the questions file.

The LAN party copy needs this shared/exam-question.js and must send the same text; its C# marker needs the `key` rules above.

## Testing without the shell

Open `TowerDefence/index.html?examStub=1` (or call `ExamGame.useStub(true)` before the first call).
The stub serves three practice questions and marks by checking the final number locally.
It is detected automatically when the page is not in an iframe.

## Rules for the game

- Timers only, never gate start-up on `requestAnimationFrame` (lessons preload apps in a hidden iframe).
- Site theme: `../shared/bc-theme.css`. No emoji, no em or en dashes. Say "denary", never "decimal".
- Optional: report a finished run to the slide with
  `parent.postMessage({ type: 'BC_APP_RESULT', ... }, '*')` as ProjectPlanner does.
