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
