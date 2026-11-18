# TowerDefence: embed and question contract

Folder: `TowerDefence/` (entry `TowerDefence/index.html`). Lesson slide embeds it as
`TowerDefence/index.html?embed=1&set=twos-complement&bcv=<build>` on the Y11 lesson `y11-1-9-defence` (slide `game`; shell registry id `tower-defence`, iframeSrc `TowerDefence/index.html?bcv=...`, the slide adds `&embed=1&set=twos-complement`).

## Questions come from the shell, never from the game

Load the client (answers and mark schemes stay on the server):

```html
<script src="../shared/exam-game-client.js?v=20261118b"></script>
```

All calls return Promises.

- `ExamGame.sets()` -> `[{ setId, title, count }]`
- `ExamGame.next(setId, { count, maxMarks })` -> `[{ qid, text, marks }]`
  - `count`: how many questions (default 1, max 10). `maxMarks`: skip questions worth more than this.
  - No repeats for a student until they have seen the whole pool, then their weakest come first.
  - `text` is plain text with `\n` line breaks (show it in a `white-space: pre-wrap` box).
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

## Testing without the shell

Open `TowerDefence/index.html?examStub=1` (or call `ExamGame.useStub(true)` before the first call).
The stub serves three practice questions and marks by checking the final number locally.
It is detected automatically when the page is not in an iframe.

## Rules for the game

- Timers only, never gate start-up on `requestAnimationFrame` (lessons preload apps in a hidden iframe).
- Site theme: `../shared/bc-theme.css`. No emoji, no em or en dashes. Say "denary", never "decimal".
- Optional: report a finished run to the slide with
  `parent.postMessage({ type: 'BC_APP_RESULT', ... }, '*')` as ProjectPlanner does.
