# bw-blocks handoff — 2026-08-12

## Completed this session

### 1. Deterministic tetris VM test (sb3-creator, cdf3ef7)

Fixed the flaky test "tetris: pieces are real tetrominoes and all four keys
respond" in `test/vm.test.mjs`.

**Root cause:** `wait` blocks read `runtime.currentMSecs` (set by
`updateCurrentMSecs()` → `Date.now()` at the top of each `_step()`). The test's
`while (Date.now() - t0 < 1600) vm.runtime._step()` loop got fewer steps under
load, starving gravity.

**Key discovery:** `Timer.nowObj` does NOT control wait-block timing. The
block-utility passes `{ now: () => runtime.currentMSecs }` to every stack timer,
bypassing `Timer.nowObj`. The sequencer's own budget timer (created at
construction) uses `Timer.nowObj` / `Date` — stubbing `Date.now()` freezes the
sequencer's budget loop, causing hangs.

**Fix:** Override `vm.runtime.updateCurrentMSecs` to feed a controlled clock.
Small dt (1 ms) during key tests freezes gravity; large dt (100 ms) for lock
section lets the 0.4 s wait expire. Also handles O-piece (ptype 2, rotation
symmetric). 5/5 green in full 50-test VM suite. `test:fast` 701/701.

### 2. AVR device gating (brickwright-lite, b7386b4 + de5f866)

Two commits:

1. **`devices/index.js`** — `_isAVR()` check: `noPCA = is12T || isAVR`,
   NeoPixel `hideFromPalette: is12T || isAVR`. On AVR: servo/motor/direction/
   NeoPixel hidden; relay/sensors/LCD/buttons visible.

2. **`pseudocode-importer.jsx`** — `refreshBlocks()` after `setStc()`.
   Extensions pre-load during `deserializeProject()` BEFORE `runtime.stc` is
   set. Without refreshBlocks, `getInfo()` runs with `stc = null` and ALL
   device gating silently no-ops. **This affects STC89 gating too**, not just AVR.

Browser-verified (Playwright, local build): Arduino Nano + Uno, 21+4 assertions
pass, zero page errors.

## Nothing in flight

All changes committed and pushed. No branches, stashes, or WIP.

## What I learned (not in a spec-update)

1. **`runtime.currentMSecs` is the wait-block clock.** Block-utility constructs
   `{ now: () => sequencer.runtime.currentMSecs }` and passes it to Timer. NOT
   `Timer.nowObj`. `updateCurrentMSecs()` is called in `sequencer.stepThreads()`
   line 76. Stubbing `Date.now()` or `Timer.nowObj` does not control wait timing
   and will freeze the sequencer budget loop.

2. **`refreshBlocks()` is required after `setStc()`.** The extension pre-load in
   the patched `deserializeProject()` calls `getInfo()` before `runtime.stc`
   exists. Predecessor's STC89 gating may have worked by accident (second load
   in same session, or stale runtime).

3. **PIN syntax for Arduino:** `PIN led = D13 OUTPUT` (the `=` is mandatory).
   Validation regex: `/^(D\d+|A\d+)$/i`. Without `=`, parser ignores the line.

## Open items

- **stc12 extension `setpwm`/`settone` on AVR:** Pin-level PWM blocks also emit
  stubs on AVR. Not gated yet — only `devices` extension was in scope.
- **Pre-existing Pico test failure** in brickwright-lite (test 53). Not caused by
  these changes.
- **6 device stubs** remain (showdigit, setrgb, setpixel, clearmatrix, ircode,
  whenirreceived) — need drivers in bw-board before unhiding.
