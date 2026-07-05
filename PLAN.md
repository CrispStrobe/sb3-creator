# SB3 Creator — Improvement Plan

Overcoming the limits of the pseudocode → Scratch 3.0 compiler (`src/utils/sb3Creator.js`).

Each item was reproduced by running code through the real parser. Status legend:
`[ ]` todo · `[x]` done · `[~]` partial.

## 1. Confirmed bugs

- [x] **B1 — `play sound X until done` is dead code.** The `play sound (.+)` rule was
  tested before the `until done` rule, so it greedily swallowed `until done` into the
  sound name and always emitted `sound_play`. Fixed by ordering `until done` first.
- [x] **B2 — A typo hard-crashes the whole parse.** `IF x:` (missing `THEN`) and
  `REPEAT n` (missing count) did `regex.match(...)[1]` on a `null` match, throwing a raw
  `TypeError` that escaped the `SB3Error`-only catch and aborted the entire build.
  Fixed with null-checked matches that emit warnings instead.
- [x] **B3 — `WHEN sprite clicked:` documented but unimplemented.** Advertised in the
  Syntax Guide and defined in `blockDefinitions`, but `parseCommand` had no rule, so it
  raised "Unknown command" and silently dropped the script. Now implemented.
- [x] **B4 — `<=` / `>=` were wrong.** `<=` mapped to `operator_lt` (plain `<`) and `>=`
  to `operator_gt` (plain `>`). Scratch 3.0 has no native `<=`/`>=`, so they are now
  emitted as `not (a > b)` and `not (a < b)`.
- [x] **B6 — Unsafe asset filenames (found by the live tests).** Costume/sound
  asset ids reused the full block-id alphabet, which includes `/` and `.`. Used as a
  filename (`<id>.svg`), JSZip path-normalizes those, desyncing a costume's `md5ext`
  from its stored zip entry and intermittently producing an unloadable asset. Assets
  now use a filesystem-safe hex id (`generateAssetId`), matching Scratch's md5 names.
- [x] **B5 — Silent no-ops for unsupported reporters.** `set foo to pick random 1 to 10`
  produced no warning and stored the literal string. All defined-but-unreachable blocks
  are now wired to real syntax (see §2), and unknown reporters fall back predictably.

## 2. Language features (defined blocks that were unreachable, plus new)

- [x] **F1 — Reporters in expressions:** `x position`, `y position`, `direction`, `size`,
  `costume number`, `costume name`, `backdrop number`, `backdrop name`, `volume`,
  `loudness`, `username`, `answer`, `timer`, `mouse x`, `mouse y`, `distance to X`.
- [x] **F2 — `pick random A to B`** → `operator_random`.
- [x] **F3 — Math & string reporters:** `A mod B`, `round A`, `abs of A`, `sqrt of A`,
  `floor of A`, `ceiling of A`, `sin/cos/tan of A`, `A join B`, `letter N of A`,
  `length of A` (string), `A contains B`.
- [x] **F4 — Precedence + parentheses.** New paren-aware, precedence-correct expression
  engine replaces the fragile "split on first operator" logic. `2 * (a + b)` and
  `a + b + c` now parse correctly (previously `a + b + c` was silently dropped).
- [x] **F5 — Compound conditions:** `and`, `or`, `not`, and parentheses in `IF` /
  `REPEAT UNTIL` / `WAIT UNTIL` conditions.
- [x] **F6 — Boolean predicates in conditions:** `key X pressed?`, `mouse down?`,
  `touching X`, `touching color #RRGGBB`, `L contains V`, `A contains B`.

## 3. Events & control flow

- [x] **E1 — Broadcast registry.** Broadcasts are registered on the Stage and referenced
  by id, so `broadcast "msg"` emits a valid `event_broadcast` input.
- [x] **E2 — `broadcast X and wait`** → `event_broadcastandwait`.
- [x] **E3 — `WHEN I receive "msg":`** → `event_whenbroadcastreceived` hat (previously
  broadcasts could be sent but never received).
- [x] **C1 — Clones:** `create clone of myself|Sprite`, `delete this clone`,
  `WHEN I start as a clone:`.
- [x] **C2 — `REPEAT UNTIL cond:`** → `control_repeat_until`.
- [x] **C3 — `WAIT UNTIL cond`** → `control_wait_until`.
- [x] **C4 — `stop this script` / `stop other scripts in sprite`** stop options.

## 4. Motion / Looks / Pen / Data

- [x] **M1 — `glide S secs to x: A y: B`**, `point towards X|mouse-pointer`,
  `if on edge bounce`, `set rotation style ...`.
- [x] **L1 — `switch backdrop to X`, `next backdrop`, `go to front`, `go back N layers`,
  graphic effects (`set/change [effect] effect`, `clear graphic effects`).**
- [x] **P1 — `stamp`.**
- [x] **D1 — Lists:** `add X to L`, `delete N of L`, `delete all of L`, `insert X at N of
  L`, `replace item N of L with X`, `show list L`, `hide list L`, and reporters
  `item N of L`, `item # of X in L`, `length of L`, `L contains X`.
- [x] **D2 — `show variable` / `hide variable`.**

## 5. Semantics & DX

- [x] **S1 — Explicit scoping.** `GLOBAL name`, `LOCAL name`, `LIST name` (and
  `GLOBAL LIST name`) declarations replace the surprising hardcoded magic-name list for
  deciding global vs. local. The magic list is kept only as a backwards-compatible
  fallback.
- [x] **S2 — Distinct per-sprite costumes.** Each sprite gets its own colored costume so
  two sprites no longer render as the identical cat face.
- [x] **S3 — Robust structural parsing.** Null-checked headers, friendly warnings, and a
  post-parse referential-integrity check.

## 6. Testing & CI

- [x] **T1 — Unit tests** (`test/unit.test.mjs`): per-feature assertions on emitted
  block opcodes, inputs, fields, precedence, and scoping.
- [x] **T2 — Live/end-to-end tests** (`test/live.test.mjs`): compile every example + the
  clone-based snake to a real `.sb3`, unzip, and deeply validate `project.json`
  referential integrity (every `next`/`parent`/input block ref resolves, shadows exist,
  variable/broadcast ids are declared, no dangling blocks).
- [x] **T3 — `npm test`** runs both suites headless (no browser, no new dependency).

## 7. Docs & examples

- [x] **DOC1 — Syntax Guide** updated to match the real, expanded grammar.
- [x] **DOC2 — New examples**, including a real growing-tail Snake built on clones + lists.
- [x] **DOC3 — README** notes the expanded language and how to run the tests.

## 8. Round 2 — gaps found by building Tetris / Breakout / Bomberman

Building real games (and running them in the actual Scratch VM) exposed the next tier.

- [x] **Custom blocks (procedures).** `DEFINE [FAST] name (arg) <boolArg>:` defines a
  reusable block; calls like `draw box 3 4` compile to `procedures_call` with a matching
  mutation. Params resolve to argument reporters in the body; `FAST` = run without screen
  refresh (warp). Forward references (call before `DEFINE`) resolve via a first pass.
- [x] **`[property] of [Sprite|Stage]`** → `sensing_of` (e.g. `x position of Player`).
  Only fires when the right-hand side is a real target, so it can't silently swallow a
  plain identifier.
- [x] **Current date/time:** `current year|month|date|hour|minute|second`, `day of week`.
- [x] **Music extension:** `play note N for B beats`, `play drum N for B beats`,
  `rest for B beats`, `set tempo to N`, `change tempo by N`.
- [x] **Misc:** `set drag mode draggable|not draggable`, bare `turn N degrees`.
- [x] **BUG — custom-block arg capture.** The first implementation matched call args with
  lazy `(.+?)` regex groups, which split parenthesized args like `(pr + 1)` into `(pr`.
  Found via the Scratch-VM Tetris run (a locked piece filled 3 cells instead of 4). Fixed
  with paren/quote-aware token matching.
- [x] **BUG — clone placement race in `snake_pro`.** Body clones read the shared head
  position after it had already moved, so the tail rendered on top of the head. Fixed to
  the correct `broadcast … and wait` handshake so each segment is stamped before the head
  advances.
- [x] **Forward-reference hardening.** A first pass now also collects sprite names so
  `sensing_of` a sprite defined later in the file resolves.

## 9. Round 2 — testing & examples

- [x] **VM tests** (`test/vm.test.mjs`): every example is loaded into the real headless
  Scratch VM and stepped; feature logic (custom blocks, precedence, list math, `pick
  random` bounds, clone creation) is verified by executing and reading back VM state.
- [x] **New examples:** `breakout`, `bomberman`, and a list-and-custom-block `tetris`.
- [x] **Dependency hygiene:** `package.json` dev deps were out of sync with the lockfile
  (declared eslint 8 while the v9 flat config and lock needed eslint 9). Aligned the
  ranges and added the missing `@eslint/js` / `globals` so `npm install` is reproducible.

## 10. Round 3 — Pong / Sokoban / more games

- [x] **New games:** `pong_2p` (two-player key polling), `pong_ai` (AI paddle via
  `sensing_of`), `sokoban` (list-grid push puzzle with custom blocks), `invaders`
  (bullet + enemy clones), `flappy` (gravity + scrolling pipe clones).
- [x] **BUG — reporter/operator precedence.** `item ((r*8)+c)+1 of board` was mis-parsed:
  the arithmetic pass split the trailing `+ 1` off *before* the `item…of` reporter was
  recognized, so list indices were wrong. Found by driving Sokoban in the Scratch VM (a
  push wrote to the wrong cell; the same bug silently corrupted Tetris's collision read).
  Fixed by recognizing the *bounded* reporters (`item`/`letter`/`pick random`, which end
  at an `of`/`to` keyword) before operator splitting, while leaving *unbounded* ones
  (`abs of`, `round`, …) after operators so `abs of vx * -1` still means `(abs of vx)*-1`.
- [x] **VM logic tests** for the Sokoban push mechanic (drive arrow-key hats, assert the
  box moved and walls block) and the Pong-AI tracker (`sensing_of` resolves at runtime).
- [x] **Game-design note:** `stop this script` inside a custom block does not reliably
  halt the procedure in the VM; the games branch on state explicitly instead.

## 11. Round 4 — browser render harness (Playwright + WebGL)

Headless `scratch-vm` has no renderer, so `touching`/collision is inert. A browser
harness closes that gap.

- [x] **Harness** (`test/browser/`): esbuild bundles `scratch-vm` + `scratch-render`
  (WebGL) + `scratch-svg-renderer`; a Playwright test loads generated `.sb3` files into
  headless Chromium (SwiftShader WebGL), drives them, and screenshots the stage.
- [x] **Real collision tests:** overlapping sprites report `touching: true`, separated
  ones `false`, and a `touching`-gated script (score-on-hit) fires — none of which the
  headless-VM suite can check.
- [x] **Gameplay screenshots** for breakout / pong / sokoban / invaders / snake / flappy,
  written to `test/browser/shots/`. Confirmed the games render correctly (e.g. Breakout's
  brick wall + paddle + ball; Sokoban's color-coded grid).
- [x] **Two bugs caught by looking at the screenshots:** clone-placement loops need more
  than a few frames before the stage is populated; and the harness leaked the previous
  project's VM/renderer across loads (fixed by reloading the page per project).
- [x] `npm run test:browser` (opt-in, needs `npx playwright install chromium`); the
  default `npm test` stays browser-free.

## 12. Round 5 — app UI, CLI, tic-tac-toe

- [x] **UI bug:** the example dropdown hard-coded only 4 examples, so none of the games
  (or the basics) were reachable in the actual app. `Examples.jsx` now renders every
  example, grouped (Games / Demos / Language basics), verified by driving the running app
  with Playwright (dropdown has all entries; selecting one loads it; Generate succeeds).
- [x] **CLI** (`bin/sb3c.mjs`, `npm bin` `sb3c`): compile a pseudocode file to `.sb3`
  from the command line, with a `--check` (parse + integrity only) mode. Tested in
  `test/cli.test.mjs`.
- [x] **New games:** `tictactoe` (2 players) and `tictactoe_ai` — the AI is a custom
  block that tries to win, else blocks, else takes centre, else the first free cell,
  driven off the board list. Verified in the VM by driving mouse clicks (one move per
  turn; it blocks a real threat) and rendered in the browser.
- [x] **BUG (game logic):** the AI placed two marks per turn — two *separate* `IF`s tested
  a board cell that the first branch mutated. Same shape as an earlier turn-switch bug.
  Fixed with `IF/ELSE`; noted as a language gotcha (branches that mutate the tested state
  must be `ELSE`, not sequential `IF`s).
- [x] Harness gained `clickAt` (mouse) so the browser suite can drive click-based games.

## 13. Round 6 — compiler hardening

- [x] **Line numbers in diagnostics.** Every parser warning is now prefixed `Line N:`
  (via a `warn(i, msg)` helper), so users can find the offending line.
- [x] **Multi-costume sprites.** `COSTUME <name>` adds an animation frame to the current
  sprite (each frame is a distinct SVG, slightly squished so cycling reads as movement);
  `next costume` / `switch costume to` now have real costumes to cycle. `BACKDROP <name>`
  adds stage backdrops.
- [x] **Real (audible) sounds.** The default Meow/Pop sounds and any `SOUND <name> [freq]`
  declaration are now generated 16-bit PCM WAV sine tones (with fades) instead of the
  silent placeholder, so `play sound` actually makes sound in Scratch.
- [x] **Reference validation.** `touching`, `create clone of`, `… of`, `point/go towards`
  and distance menus that name a sprite which doesn't exist now warn (typo catcher);
  previously they silently produced dead menus.
- [x] **Asset generation cleanup.** Costumes and sounds are all generated into the asset
  map with filesystem-safe ids; only the Stage's gradient backdrop remains a fixed asset.
- [x] New `animation` example (costume cycling + a step beep). 102 tests pass.

## 14. Round 7 — parser robustness

- [x] **Flexible indentation.** The parser previously hard-required a 2-space indent step,
  so 4-space, tab, or CRLF files silently broke on nested blocks. Line endings are now
  normalised, leading tabs expanded, and child-block indent is read from the following
  line — 2-space, 4-space, tabs, and CRLF now all parse identically.
- [x] **Costume/sound name validation.** `switch costume to "typo"` and `play sound "typo"`
  warn when the name isn't defined (sounds are checked project-wide so shared names like
  the Stage's Pop are fine). Fixed the `looks` example, which had always switched to a
  non-existent `costume2`.
- [x] **Duplicate sprite names** are flagged.

## 15. Round 8 — inline comments, 2048, maze

- [x] **Inline comments** with `//` (a safe marker — `#` clashes with hex colours and
  `item # of`). Stripped outside double-quoted strings, so `#ff0000`, `item # of`, and
  URLs in strings survive.
- [x] **2048** (`g2048`): a 4x4 board in a list; one `slide` custom block does the
  slide+merge-once for a line and is reused for all four directions; tiles are colour-coded
  by value. VM-tested deterministically (a line merges correctly, score updates, a new
  tile spawns).
- [x] **Maze chase** (`maze`): an 11x9 wall grid with dot-eating and a ghost whose custom
  block greedily hunts the player. VM-tested (player eats dots; the ghost provably moves
  toward the player) and rendered in the browser.

## 16. Round 9 — real sprite shapes + "Open in Scratch"

- [x] **SHAPE declaration:** `SHAPE rect|square|circle|ellipse|triangle <dims> [#hex]`
  replaces a sprite's costume with a true-sized geometric shape, and `SHAPE polygon x1 y1
  x2 y2 … [#hex]` bakes an arbitrary custom SVG. Applied across every game: Pong has real
  rectangular paddles + round ball, Breakout real bricks/paddle/ball, Tetris/2048 crisp
  square cells, Invaders a triangular ship, etc.
- [x] **"Open in Scratch" button:** opens the generated project straight in the hosted
  TurboWarp editor by passing the whole `.sb3` as a `data:` URL in the location **hash**
  (the fragment isn't sent to the server, avoiding GitHub Pages' 414 URI Too Long).
- [x] **scratch-gui fork change:** `project-fetcher-hoc` now also reads `project_url` from
  the URL hash (branch `feature/sb3creator-handoff`), built and deployed to gh-pages with
  a `.nojekyll` (Jekyll was hanging the Pages build on the JS bundles). Verified
  end-to-end against the **live** editor: a generated game loads with all sprites, shapes,
  blocks, and variable monitors intact.
- [x] Halved default tone-sound sample rate to shrink projects (pong 103KB -> 64KB).

## 17. Round 10 — Connect Four, custom SVG upload

- [x] **Connect Four (vs AI):** gravity-drop discs + a custom block scanning every
  4-in-a-row window; the AI wins/blocks/plays-centre. VM-tested (discs stack, AI blocks
  an open three). Bug found via the VM: the AI loop shared globals with the `check win`
  block it called, clobbering its counter — fixed with a private loop variable.
- [x] **Custom SVG upload:** `applyCustomSVG(sprite, svgText)` bakes a user-supplied SVG
  in as a sprite's costume; a new `SvgUploader` panel in the app lets you drop in `.svg`
  files, assign each to a sprite by name, and Generate bakes them in (and they ride into
  Scratch via the "Open in Scratch" button). Verified end-to-end by driving the running
  app with Playwright.

## 18. Round 11 — uploader UX + Minesweeper

- [x] **SVG uploader UX:** inline thumbnail preview (safe `<img>` data URL) and a per-file
  mode — "replace costume" or "add as frame" (`addCustomSVGCostume`) to assemble
  animations from uploaded art.
- [x] **Minesweeper:** 9x9 / 10 mines; clicking an empty cell flood-fills the connected
  region via a worklist queue stored in a list. VM-tested (a click on a 0-neighbour cell
  cascades to reveal ~49 cells). Surfaced an ergonomic rule: a computed custom-block
  argument must be a single token, so `((r*9)+c)+1` must be wrapped as `(((r*9)+c)+1)`.

## 19. Round 12 — integration into the TurboWarp fork (CrispStrobe/brickwright)

Everything below lives in the **scratch-gui fork** (branch `develop`, deployed to gh-pages),
built on TurboWarp. The compiler (`src/lib/sb3-creator.js`) is vendored from this repo.

- [x] **"Open in Scratch" button** (this repo): opens the generated project in the hosted
  editor by passing the whole `.sb3` as a `data:` URL in the location **hash** (fragment
  isn't sent to the server → avoids the `414 URI Too Long` a query string hits).
- [x] **scratch-gui: `project_url` via hash** — `project-fetcher-hoc` reads `project_url`
  from the hash as well as the query, so the handoff works.
- [x] **scratch-gui: `#pseudocode=<code>`** — the fetcher compiles pseudocode in-browser
  (lazy-loaded compiler chunk) and loads it. Tiny URL (pong is ~3KB of code vs ~90KB as a
  `.sb3`).
- [x] **scratch-gui: a real "Pseudocode" editor tab** next to Code / Costumes / Sounds
  (not a floating panel — first attempt was a bottom-left overlay, replaced per feedback).
  The tab holds a pseudocode textarea + per-sprite SVG-costume upload + "Compile & Load",
  which runs the compiler + `applyCustomSVG` and calls `vm.loadProject`. Verified in a
  local headless build.
- [x] **Deploy:** the Pages build hung until a `.nojekyll` was added (Jekyll was choking on
  the JS bundles); with it, builds are fast and the live editor picks up new chunks.
- [x] **Pseudocode tab at parity with the standalone app** — the tab was a bare textarea;
  now it has the example catalogue (all 28, grouped), a collapsible syntax reference, and
  the SVG uploader. The uploader is a **2-column association table** (`SVG file | Sprite |
  Mode`) whose Sprite column is a dropdown populated from the `SPRITE` names parsed live
  from the pseudocode — so you pick a real sprite instead of typing a name (verified live:
  loading Snake lists `Snake`, `Apple`). `add as frame` mode wires `addCustomSVGCostume`.
- [x] **Vendored-file syncing** — `src/lib/sb3-creator.js` + `sb3-creator-examples.js` are
  copies of this repo's `src/utils/{sb3Creator,examples}.js`. `scripts/sync-sb3creator.mjs`
  (`npm run sync:sb3creator[:check]`) pulls them from `raw.githubusercontent…/main`; CI runs
  the `--check` variant (informational) to flag drift.
- [x] **CI** — this repo had none. `.github/workflows/ci.yml` runs lint + the 152
  `node --test` tests + the vite build, plus a separate non-blocking headless-WebGL
  render job; concurrency cancels superseded runs, docs-only pushes skip. (The very first
  run caught a latent `no-unreachable` dead-code line in `dval`.) The scratch-gui fork's
  workflow got the same concurrency/paths-ignore treatment + the drift check.

## 20. Ecosystem notes (CrispStrobe LEGO toolchain)

- The LEGO transpilers (`lego-nxt-bt/*_transpile*.js`, `ev3_universal.js`, …) are
  **block-tree walkers**: `transpileProject()` → `processBlockChain()` (follows `next`,
  recurses substacks) → `processBlock()` (opcode switch → emit target code), targeting
  **LMS assembly / ev3dev Python / NXC**, then the external `lego-compiler` API
  (NBC + ev3dev `lmsasm`) turns those into `.rxe` / `.rbf` bytecode for the brick.
- `Makeblock-official/mBlock` is **mBlock 3** (ActionScript / Scratch 2.0 / 2017, GPL-2.0),
  not the modern React switch. Its `ArduinoManager.as` is the same recursive walker with
  per-opcode `parseX` emitters → Arduino C (one-way "code mode"). The pattern is universal;
  the code isn't portable.
- Conclusion: blocks-as-hub, with one-way walkers everywhere. We can do a genuine
  **round-trip** for our DSL because we own both directions.

## 20b. Round 13 — monitor visibility + a real Tetris

- [x] **Monitors hidden by default.** `createMonitor` now sets `visible: false` — games
  declare lots of internal state (loop counters, board cells) that shouldn't clutter the
  stage. `show variable X` / `show list X` (and `hide …`) toggle it via a new
  `setMonitorVisible`, so a display is opt-in and shown from frame 0. The 8 arcade examples
  that track a score got `show variable score`. Unit-tested in `features.test.mjs`.
- [x] **Tetris rewritten into a real Tetris.** The old one was a deliberately-simplified
  2×2 block with no well border and only Left/Right bound. Now: all 7 tetrominoes on a
  10×20 well, **Up** rotates (90° about a pivot), **Down** soft-drops, **Left/Right** move,
  full rows compact + score, a **pen-drawn well border**, and per-piece colour tinting via
  the colour effect. VM-tested (`vm.test.mjs`: 4 distinct cells, all four keys respond,
  soft-drop to the floor, real-time gravity locks into the board) and verified live in the
  deployed editor.
- [x] **CI annotation hygiene** (scratch-gui fork): the non-gating lint + vendored-drift
  steps now emit `::warning::` instead of failing (`cmd || echo ::warning::`), so runs are
  green with no red ✗; the drift check compares against a real checkout of the source repo
  (via `sync-sb3creator.mjs --dir`) instead of the lagging raw CDN.

## 21. Roadmap

- [x] **Decompiler + block⇄code round-trip** (done). `decompile(project) → pseudocode`
  — the inverse walker (same shape as the LEGO transpilers' `processBlockChain`). Emits
  GLOBAL/LIST/BACKDROP/SOUND declarations, then per-sprite COSTUME/SOUND + scripts, with
  reporters parenthesised so each value is a single token. Round-trip tested
  (`pseudocode → blocks → pseudocode → blocks`) across all 28 examples: identical block
  structure, zero recompile warnings, VM behaviour preserved (`test/decompile.test.mjs` +
  a behavioural check in `test/vm.test.mjs`). Also verified against real `vm.toJSON()`
  output. Wired into the TurboWarp Pseudocode tab as a **⟵ From blocks** button next to
  **Compile & Load**, making the tab a true two-way block⇄code view (verified live at
  crispstrobe.github.io/brickwright via Playwright).
- [ ] **Extension-aware compilation** — read loaded extensions' block metadata
  (`vm.runtime._blockInfo`: opcode + text template + typed args) and auto-derive pseudocode
  grammar, so a LEGO walker gait can be written in pseudocode and emit `spikeprimeble_*`
  opcodes + `extensions[]`.
- [ ] **Later:** mirror Makeblock's device-connection UX for the LEGO extensions;
  MakeCode-style micro:bit support (simulator + upload + device panel) in the GUI.
