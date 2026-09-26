# Bloomsbury Computing: pages repo

Everything the school computing site shows that does not need the student's account: lesson content, drills, and every app and game. Served by GitHub Pages at `https://jqblooms.github.io/Bloomsbury-Computing/` (repo `jqblooms/Bloomsbury-Computing`, branch `main`) and loaded inside the Apps Script shell, which handles sign-in, navigation and saving.

**The shell repo has the main docs**: `Desktop/Apps Script/bloomsbury-computing-main/CLAUDE.md` and its `docs/` folder (architecture, design system, lessons policy, drills, support mode, progress and sync). Read the relevant one there before changing anything here.

## Layout

- `LessonData/lessons.json` (which lessons appear, per year) and `LessonData/<id>.json` (one lesson each). See the shell's `docs/lessons.md`, including the standing lesson policy.
- `LessonAssets/`: images used by lessons.
- `Drills/`: the drills engine and one data file per drill (`Drills/data/<id>.js`). See the shell's `docs/drills.md`.
- `shared/`: what every app shares:
  - `shared/bc-theme.css`: the site's look (tokens, fonts, control defaults). Every registered app page must load it.
  - `shared/bc-tailwind.js`: for Tailwind apps, load straight after the Tailwind CDN script; re-points Tailwind's colour names at the site palette.
  - `shared/bc-support.js`: support mode (one site-wide switch, typed-answer hints, fading). See the shell's `docs/support-mode.md`.
  - `shared/cloud-save.js`: mirrors chosen localStorage keys to the student's account through the shell.
  - `shared/frame-relay.js`: for a wrapper page around one editor iframe; passes `BC_*` messages both ways.
  - `shared/pseudocode-engine.js`: the Cambridge pseudocode interpreter (DECLARE required, types checked).
- Apps, one folder each with an `index.html`: `BinaryBlitz`, `BooleanBlitz`, `PseudocodeBlitz`, `FlowchartBlitz`, `StorageBlitz`, `FileForge`, `HexMachine`, `BinaryMine`, `LogicCircuits`, `PacketLab`, `ControllerDesigner`, `TraceTablePractice`, `PythonGame`, `PseudocodeFarmer`, `PseudocodeReference` (the Y11 Pseudocode Recap), `ByteBrawlers` (Live Game launcher and host download), `HexQuiz` (hex digits and the 16 times table), `AlgorithmPractice` (`search.html` and `sort.html`, sharing `style.css` and `common.js`).
- Split apps keep `index.html` small and load `style.css` plus `js/*.js` in order through a loader that passes the page's `bcv` as `?v=`: `Drills`, `PseudocodeReference` (`interpreter`, `topics`, `app`), `TraceTablePractice` (`data`, `progress`, `ui`, `support`, `practice`, `generator`, `embed`, `main`), `LogicCircuits` (`gates`, `questions`, `board`, `wires`, `scoring`, `support`, `menu`, `help`), `PythonGame` (Python Defense: `powerups`, `data`, `stats`, `play`, `loader`, `answers`, `exams`, `runner`, `interpreter`, `support`, `menu`; its level files are JSON fetched at play time), `PseudocodeFarmer`. The files share one scope in load order, so a file may only use what an earlier file declared at load time. Split a new app the same way once it passes about 1,000 lines.
- TurboWarp: `scratch/` is the TurboWarp build; `scratch/editor.html` loads the PyScratch, FlowScratch and TurboBot overlays from the root `assets/js/` folder, each active only with its URL flag. Their `?v=` tags in `scratch/editor.html` are pinned by hand, as are `psv` / `fsv` / `tbv` in the wrappers: bump them when an overlay changes. `PyScratch/`, `FlowScratch/` and `TurboBot/` are thin wrappers (`TurboBot/pybot.html` is PyBot).
- `ExamArcade/`, `ExamCircuit/` and `GDD.md`: a game still being designed; keep them.
- `oauth-callback.html`: the Classroom sign-in popup's landing page.
- `tools/`: lesson builders (`tools/build_y10_2_1_l1.mjs` writes `LessonData/y10-2-1-l1.json`: edit the builder, not the JSON) and interaction tests.
- `build_y7_revision_drills.mjs` (untracked, root): targets the old single-file Drills page and no longer works as written.

## Rules for any app here

- **Look like the site.** Load `shared/bc-theme.css` (and `shared/bc-tailwind.js` for Tailwind). Use the tokens (`var(--surface)`, `var(--ink)`, `var(--brand)`), not new colours. No old styles anywhere (James, 2026-09-26): a game world may keep its art, but its panels, buttons, type and backgrounds are the site's; rebuild a page rather than leave it in an old look. The shell's check-site fails if a registered page does not load the theme (only the TurboWarp editor is exempt; see the shell's `docs/ui-design-system.md`).
- **Embed mode.** With `?embed=1` an app drops its page chrome, keeps a transparent background, and reports its height with `TT_CONTENT_HEIGHT` so a lesson can size the iframe.
- **Cache-busting.** The shell adds `?bcv=<GH_PAGES_BUILD>`; a split app passes it to its own files as `?v=`. Every `<script src>` to `shared/` carries a `?v=` too: bump it when that file changes.
- **Talking to the shell.** `postMessage` to `window.parent`; the protocol table is in the shell's `docs/architecture.md`. Opened on its own (`window.parent === window`), an app must work with nothing saved to the account.
- **Support mode** where the task allows it: show how, fade with success, never in tests.
- **No em or en dashes** in anything a student sees (all four forms: raw and `&mdash;` / `&ndash;`).
- Build lesson and drill JSON with a script file, never by hand-escaping in a shell.

## Test and ship

- `node tools/serve-pages.mjs 8765` (in the shell repo) serves this repo with caching off; add `&pages=local` to the shell harness URL (`http://localhost:8766/?as=student&pages=local`) to try changes inside the site.
- `node tools/check-site.mjs` (shell repo) parses every script here, resolves every loader and `<script src>`, and grades every drill card and recap answer key.
- Ship: commit and push `main`, wait until GitHub Pages serves the new file, then bump `GH_PAGES_BUILD` in the shell and deploy it (the shell's `docs/shipping-and-testing.md`).
