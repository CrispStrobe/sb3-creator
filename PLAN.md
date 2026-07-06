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
- [~] **Multi-target code generation (blocks → Python / JavaScript)** — in progress; see §22.

## 22. Multi-target code generation — blocks ⇄ pseudocode ⇄ Python / JS

**Why:** the on-ramp Scratch never shipped. We already own the block→text direction
(the decompiler *is* a code generator); adding Python and JS makes Brickwright *"the same
project as blocks, pseudocode, Python, or JS, in one editor"* — then run it fast or on a
brick. Our EV3-Python extension already proves block→Python for a domain; this generalises it.

**Architecture.** Refactor `decompile()` into a multi-target `CodeGen`
(`target ∈ {pseudocode, python, javascript}`) that shares the block-tree walker and the
precedence/parenthesisation logic we already have. Each opcode maps to a per-target emit
(same pattern as Blockly's generators, and as our LEGO transpilers' `processBlockChain`).

**Two hard truths that shape the design:**
1. **Direction is asymmetric.** blocks→text is easy (we do it). text→blocks needs a real
   parser (Droplet / BlockPy's BlockMirror territory) — deferred to a later phase.
2. **Scratch's model ≠ plain Python/JS** (sprites, clones, broadcasts, parallel scripts,
   pen). So two fidelity tiers:
   - **Runnable-minimal** — the *algorithmic* subset (variables, math, loops, if/else,
     lists, `say`→`print`, `ask`→`input`) emits idiomatic, standalone-runnable Python 3 / JS.
     A big chunk of the educational examples (quiz, operators, 2048's slide logic) are pure
     algorithm and map cleanly.
   - **Runtime-backed** — full sprite/graphics projects emit readable code against a small
     documented `brickwright` runtime API (or keep executing in the VM and treat the code
     as a synced *reading* view).

**Prior art to mirror:** Blockly's 5 generators (the `ORDER_*` precedence + per-block-func
pattern; `nameDB_` identifier sanitising); **BlockPy / BlockMirror** (true Python↔blocks via
AST, in-browser exec via **Skulpt/Pyodide**, subset-restricted for clean round-trip);
**Droplet / Pencil Code** (bidirectional block↔real-text); **MakeCode/pxt** (pick one
canonical form — for us the sb3 block tree — and project both blocks and Python from it);
**Open Roberta** (Blockly→real robot code incl. LEGO EV3/NXT/Spike — the closest OSS match
to our bricks×education×codegen intersection); **BlocklyML** (domain Blockly→Python template).

**Phases:**
- [~] **P1 (tractable, high-value):** multi-target codegen, one-way.
  - [x] **Python emitter** (`generatePython`) — walks the block tree (same shape as the
    decompiler): variables/math/loops/if-else/lists/`say`→`print`/`ask`→`input` emit
    runnable Python; sprite/pen/sound blocks become `# comments`; custom blocks → `def`s
    (with `global` decls); hats → functions, flag-hat called at the end; a `_eq` helper for
    Scratch's loose equality; conditional `import`s. Tested: all 28 examples produce
    **syntactically valid Python** (real `py_compile` in `test/codegen.test.mjs`), and the
    quiz **runs and scores correctly** (fed `12`/`32` → `2`).
  - [x] **JavaScript emitter** (`generateJavaScript`) — same walker, JS templates; closures
    mean no `global` decls and empty `{}` needs no `pass`. Runs in a browser (console/prompt).
    Tested: all 28 examples parse (`new Function`), the quiz runs and scores `2`.
  - [x] **In-editor language switch** — a *Pseudocode / Python / JavaScript* dropdown next to
    **From blocks** in the Code tab. Pseudocode stays two-way (editable + Compile & Load);
    Python/JS are read-only views (Compile & Load auto-disables). Verified live at
    crispstrobe.github.io/brickwright: compile the quiz → From blocks as Python → real
    `input()`/`_eq`/`def`/`print`.
- [x] **P2 — run the emitted code in-editor** (both languages runnable; console panel).
  - [x] **JavaScript run** — a **▶ Run** button on the JS view executes the code natively
    (`new Function` with a captured `console` + `prompt`; the editor already allows eval for
    the VM compiler) and prints to a console panel. Refuses `forever` loops (they'd hang the
    tab) with a friendly note; the algorithmic examples (quiz, operators, 2048 logic) run.
    **Verified live** at crispstrobe.github.io/brickwright: compile the quiz → JavaScript →
    From blocks → Run → the console prints "Correct!" ×2 and final score `2`.
  - [x] **Python run** via **Skulpt** — Skulpt assumes a global `Sk` and won't survive webpack's
    module wrapper, so the prebuilt `skulpt.min.js` + `skulpt-stdlib.js` are injected as real
    `<script>` tags at runtime (lazy, via `raw-loader`) and executed with
    `Sk.misceval.asyncToPromise`. `ask`→`input()` is wired to `window.prompt`; `say`/`print` to
    the console panel. Key fix: `stop all` emitted `raise SystemExit`, which Skulpt propagates as
    an uncaught error and swallows all prior output — changed to `return` (and `stop other
    scripts` → a comment). **Verified live** at crispstrobe.github.io/brickwright: compile the
    quiz → Python → From blocks → ▶ Run (answers 12/32) → the console prints "Welcome to the Math
    Quiz! / Correct! / Correct! / Your final score is / 2" with no error.
  - [x] **Harden — Web Worker + timeout.** Non-interactive code (JS and Python alike) now runs
    in a fresh `Worker` built from a `Blob` URL, streaming output back over `postMessage`; a
    runaway loop is `terminate()`d after 4 s and reported as "⏱ Stopped after 4s…" instead of
    freezing the tab. Interactive programs (that read `prompt`/`input`) keep the main-thread path
    since a Worker has no synchronous prompt, and an obvious top-level `forever` game loop still
    gets an instant "press the green flag" nudge (the timeout is only the safety net for
    non-obvious infinite loops). Python reuses the cached Skulpt sources, concatenated with a
    worker runner. **Verified live** at crispstrobe.github.io/brickwright: `operators` (JS) runs
    in the Worker and prints its results; the quiz (Python, input) still runs on the main thread;
    the `control` forever loop shows the nudge — all with no page errors.
- [ ] **P2:** a tiny `brickwright` Python/JS runtime shim so full projects' emitted code runs
  (or lean on the VM for execution + show the code as a reading view).
- [x] **P3 — Python → blocks (genuine round-trip).** `pythonToPseudocode.js` is a
  dependency-free tokenizer + Pratt expression parser + translator for the algorithmic Python
  subset (assignments, `if/elif/else`, `while`, `for _ in range`, `print`/`input`, `def`,
  arithmetic, comparisons, `_eq`, list ops). It maps Python back to Brickwright pseudocode, which
  `parse()` recompiles to blocks — so Python is now **two-way**, alongside pseudocode. Helper defs
  (`_eq`) and out-of-subset sprite/pen behaviour (which live in the blocks, not the text) are
  dropped with warnings rather than guessed. All 28 examples round-trip; the quiz still scores 2
  after Python → blocks (31 tests in `test/roundtrip.test.mjs`).
- [x] **P3 — JavaScript → blocks (all three languages two-way).** `javascriptToPseudocode.js`
  parses the emitted JS subset (`let` state, `function`, `if/else`, `while`, C-style `for`,
  `console.log`/`prompt`, `===`/`&&`/`!`, `_eq`/`_rand`, `.push`/`.splice`/`.length`) into the
  *same* AST the Python front-end builds and reuses the shared `Translator` (JS idioms normalised
  to its Python-flavoured nodes). All 28 examples round-trip through JS too; the quiz scores 2 and
  an edit changes it to 1. 69 tests in `test/roundtrip.test.mjs`.
- [x] **GUI — 3-tab syntax-highlighted editor.** The Pseudocode tab is now three real tabs
  (`🧩 Pseudocode` / `🐍 Python` / `🟨 JavaScript`), each with its own buffer and per-language
  highlighting (overlay: coloured `<pre>` behind a transparent `<textarea>`, caret + Tab-indent).
  Editing a tab clears the others so switching always re-derives from the latest edit through
  blocks — structurally impossible to feed (say) pseudocode to the Python parser (the cause of the
  earlier "unexpected `:`" / "bad input on line 1" errors). **To blocks** compiles the active tab,
  **From blocks** fills all three, **▶ Run** executes Python/JS. Fix: the tab buttons must *not*
  use `role="tab"` — that collided with the editor's top-level react-tabs and switched to
  Costumes/Sounds by index. **Verified live** across all paths (tab conversion, compile-from-each,
  run, two-way editing to score 1) with no page errors.

Multi-target codegen is **feature-complete**: **Pseudocode ⇄ blocks ⇄ Python ⇄ JavaScript** — all
three languages fully two-way, runnable in-editor, in one 3-tab highlighted editor.

### Verified correctness (the round-trip is trustworthy)

- **Execution matrix** (`test/exec.test.mjs`): all 28 examples' generated JS actually *runs* in a
  bounded `vm` (games hit the loop timeout = still-running, not an error) — 0 runtime errors. Python
  likewise runs under a subprocess timeout. Quiz scores 2 in both languages.
- **Transpilation matrix**: every example converts pseudocode→{blocks, pseudocode, python, js} —
  112/112 recompile (`test/roundtrip.test.mjs`, both backends × 28).
- **Transparency / fixed point** (`test/transparency.test.mjs`): chaining a project through the
  languages repeatedly *converges* — 28/28 under **five different permutation orders**. Bug found &
  fixed along the way: the translator emitted `delete item N of list` but the compiler's grammar is
  `delete <index> of list`; the stray `item` was swallowed as a string index that grew every
  round-trip (g2048 never converged). Now every example is a stable fixed point.
- **Comments are preserved** (`test/comments.test.mjs`): a `# comment` attaches to the following
  block/hat as a native Scratch block comment (stored on the target — the ground truth), so it
  survives To blocks → From blocks and shows as a note on the block. Idempotent; inert for codegen.

### Deferred — bigger follow-ups (design captured, not yet built)

- [ ] **P4 — comments through the code languages.** Today block comments survive pseudocode↔blocks
  but are dropped when going through Python/JS (the parsers strip `#`/`//`). Emit block comments as
  `#`/`//` in `generatePython`/`generateJavaScript`, and have `pythonToPseudocode`/
  `javascriptToPseudocode` re-attach them to the following statement. Then a comment survives *any*
  language hop, not just pseudocode.
- [~] **P5 — extension blocks in Python/JS.** Source of truth: **github.com/CrispStrobe/extensions**
  (loaded by the fork from `crispstrobe.github.io/extensions/generated-metadata/extensions-v0.json`;
  canonical copies pinned in `reference/extensions/`).
  - [x] **Planète Maths** (`planetemaths`, pure math) — all arithmetic/compare/logic/string ops map
    to real Python/JS in `pyRep`/`jsRep`/`pyCond`/`jsCond`; block fixtures run to the right values
    (`test/extensions.test.mjs`). Semantics taken from the implementation (the boolean opcode names
    are misnomers — `gt` = `NUM1 < NUM2`).
  - [x] **Auto-declare extensions both directions** — `syncExtensions(project)` derives
    `project.extensions` (+ `extensionURLs` for custom gallery extensions) from the opcodes actually
    used, at the end of `parse()` and in `generateSB3()`. So compiling code that needs an extension
    adds it, and reading blocks parses which extensions are genuinely used.
  - [x] **Arrays & Vectors** (`arrays`, 37 blocks) — named-array registry (`_arrays = {}`), 0-based
    (matches the extension). Core ops mapped to runnable Python/JS: create1D/Empty/Range, get/set/
    push/pop/insert/remove/delete, length/sum/mean/min/max/indexOf/slice/reverse/sort/flatten/
    contains/toJSON. Also **pseudocode syntax** (anchored on `array "NAME"`): `new array "v" = [..]`,
    `push x to array "v"`, `item i of array "v"`, `sum of array "v"`, `array "v" contains x`, … —
    parses to blocks, decompiles back (idempotent), and the `arrays` example runs to correct values.
    2D/functional ops (create2D, map/filter/reduce, transpose, reshape) fall back to comments.
  - [x] **Pluggable-driver convention for runtime/hardware extensions** (`RUNTIME_EXTENSIONS`
    registry). The transpiled program is **driver-agnostic**: it calls `_<runtime>.<method>(args)`
    (e.g. `_boost.motorOn("A")`, `_gamepad.stickValue(...)`). A **driver** is emitted at the top —
    a neutral no-op *shim* by default — which is the single **swap point**: implement its methods
    to drive real hardware **on-brick** (ev3dev/pybricks) or **remotely** (USB/BLE/BTC). Same
    program, swap the driver → real hardware "on top". Menu args (motor port, button) resolve to
    their field values. Adding an extension = one declarative registry entry, not new emitter code.
    - **Gamepad** (`universalgamepad`) migrated into the registry as the reference; **LEGO Boost**
      (`legoboost`, 29 blocks: motor commands, distance/tilt/force reporters, button/color booleans)
      added declaratively. Both auto-declare + get their `extensionURL`; code runs neutral standalone
      and is verified in tests.
    - [x] **Driver-mode switch** — `generatePython/JS(project, {driver})` selects the emitted driver:
      *shim* (neutral) / *remote* (forwards to a `brickwright-bridges` WebSocket bridge) / *on-brick*
      (header pointing at the per-hardware transpilers in `CrispStrobe/extensions` that emit real
      ev3dev2/pybricks). The program is unchanged; only the driver swaps. GUI has a `🔌 driver:`
      selector on the code tabs (regenerates the view). Documented in `reference/runtime-drivers.md`.
    - [x] **async/await switch** — `{async:true}` makes functions `async`, `await`s every
      hardware/proc call, awaits driver methods (Python shim methods become `async def`), and runs
      via `asyncio.run(...)` (Python) / an `(async () => …)()` IIFE (JS). GUI checkbox.
    - [x] **event-hat switch** — the generated registry now includes HAT ops; `{events:true}` turns
      an extension hat (`whenButtonPressed`) into a handler function + a `_driver.on("opcode", fn)`
      registration (the driver shim gains an `on(event, handler)` method). GUI checkbox.
    - [ ] **Still to flesh out:** the `remote` driver actually speaking `universal_lego_bridge.py`'s
      normalized-JSON protocol end-to-end, and the `on-brick` driver reusing the transpilers.
  - Registry/runtime extensions transpile blocks → code but their **code is one-way** (the
    `_arrays[...]` registry / `_driver.method()` model doesn't reverse-map); they round-trip
    pseudocode ↔ blocks. The parsers are hardened to *survive* such code (dict/object literals,
    arrow/function expressions, driver classes) without crashing, and these examples are excluded
    from the code-language transparency invariant (kept for pseudocode ↔ blocks).
  - [ ] Reverse mapping (code → extension block) is often ambiguous (planetemaths add ≡ operator
    add); execution parity is the priority, so code→blocks normalises to standard blocks.
- [ ] **P6 — standalone executable export (TurboWarp-style packaging).** Produce a self-contained
  `.html`/`.js` (and a Python variant) that runs the project *without* Scratch — the ambitious one.
  It needs a real runtime: a canvas renderer for SVG/bitmap costumes, the sprite/clone model,
  motion + coordinate space, pen layer, collision/touching/color sensing, sound, and input
  (keyboard/mouse/gamepad). Two viable paths: (a) reuse TurboWarp's existing `scratch-vm`
  + `tw-packager` (already vendored) for the *runnable* artifact and keep our Python/JS as the
  *readable* view; or (b) a from-scratch minimal `brickwright-runtime` implementing the subset we
  emit. (a) is far less work and already near-complete via the packager; (b) is the "pure code, no
  VM" dream and is a large multi-phase effort. Recommend (a) first (wire the existing packager into
  a "Download standalone" button), then evaluate (b).

## 23. Deferred — Brickwright desktop deep rebrand

The `brickwright-desktop` **identity** layer is done (appId, update feed, homepage, Linux
`.desktop`/`metainfo`/`mime`, and the full icon set — §desktop-rebrand). Left deferred, by
deliberate choice, because each carries real risk or needs an account we don't have:

- [ ] **MS Store publisher identity** — the appx `identityName`, `publisher` cert thumbprint,
  and `publisherDisplayName` are the upstream author's Microsoft Store account. Only worth
  changing if *we* publish to MS Store, in which case swap in our own cert/identity; fake
  placeholders don't help.
- [ ] **Technical Referer-header mechanism** (`referer.html`, `project-running-window.js`) —
  internal, not user-visible; changing it risks breaking request handling. Left as-is.
- [ ] **Deep "TurboWarp" strings** — the addon system, `tw_`-prefixed settings keys, the
  `docs/` desktop marketing site (HTML + screenshots), and l10n strings in menus/About. A
  full sweep risks addon compatibility and saved-settings migration, so we did the identity
  layer, not every occurrence. Next layer if a top-to-bottom desktop rebrand is wanted.
