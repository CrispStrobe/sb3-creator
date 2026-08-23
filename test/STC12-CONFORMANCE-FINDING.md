# The stc12 conformance gap: which layer is wrong, and what the app does about it

Investigated 2026-08-23. Reproduces `ROADMAP.md` §5.1 (brickwright-lite) and extends it.
Every claim below is followed by the command that produced it.

## 1. Reproduction — and a correction to the recorded numbers

Running the gate with all three copies pinned by env var:

```
BW_GALLERY=…/extensions/extensions/CrispStrobe/stc12.js \
BW_LITE_STC12=…/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js \
BW_REFERENCE_STC12=./reference/extensions/stc12.js \
node --test test/stc12-conformance.test.mjs
```

| copy | blocks | missing of the 28 emitted |
|---|---|---|
| `reference/extensions/stc12.js` (in-repo) | 30 | **0** |
| lite `overlay/…/crispstrobe/stc12/index.js` (bundled) | 20 | **8** |
| gallery `extensions/CrispStrobe/stc12.js` | 12 | **16** |

ROADMAP §5.1 recorded the bundled gap (8) only. **The gallery copy is missing 16** —
the 8 bundled ones plus the whole `matrix_*` family (`matrix_setpx`, `matrix_getpx`,
`matrix_row`, `matrix_image`, `matrix_paint`, `matrix_scroll`, `matrix_dim`,
`matrix_clear`). That is the larger of the two gaps and it was not on record.

Both gaps are live on a shipped surface. `sb3Creator.js` gives `stc12` a gallery URL
(`crispstrobe.github.io/extensions/CrispStrobe/stc12.js`), so a host without the bundled
extension — web Brickwright, plain TurboWarp — fetches the **12-block** copy.
brickwright-lite bundles the **20-block** copy. Neither is the 28 the emitter writes.

## 2. Which layer is wrong: the downstream copies, not the emitter

Two independent lines of evidence, both pointing the same way.

**Git history.** The two waves that introduced the 8 opcodes landed in `reference/` on
2026-08-18 and were never ported downstream:

```
4962d4d 2026-08-18 KEYPAD4X4 hats mirrored: WHEN key N pressed/released + sugar …
952b623 2026-08-18 SEVENSEG8 + LEDBANK8 mirrored: ISR-scanned display and LED bank …
```

lite's bundled copy has exactly one commit that day — `e5e38bdeb lite stc12 extension:
port MATRIX8X8 block family + paint block` — which is why it sits at 12 + 8 matrix = 20.
The gallery copy's last stc12 commit is `e46d6e4` (2026-08-09, 12 opcodes) and it never
received either wave. The three copies are three hand-maintained forks that fell out of
step, in the order their last sync says they would.

**The emitter is doing what it was asked.** `examples/79-a2-sampler/program.bw` declares
`PART keys = KEYPAD4X4`, `PART display = SEVENSEG8`, `PART leds = LEDBANK8` and uses
`WHEN key 12 pressed`. Those declarations are precisely what lower to `stc12_keypad`,
`stc12_seg_*`, `stc12_led_*` and `stc12_whenkey`. They are board-level peripherals, not
chip-family features, so no device gating excludes them from `DEVICE STC89C52RC`. The
in-repo `reference/` copy defines all 28 and passes conformance unmodified.

Verdict: **the downstream copies are stale.** The emitter emits nothing it should not.

### A correction to §5.1: one example is affected, not three

§5.1 names `77-keypad-keyshow`, `78-a2-calculator` and `79-a2-sampler`. Compiling all
three and intersecting their opcodes with the bundled gap:

```
77-keypad-keyshow   read×4  setport×2  setpin×8  tableindex×1     → affected: none
78-a2-calculator    read×8  setpin×8   setport×4 tableindex×2     → affected: none
79-a2-sampler       seg_shownum×3 keypad×2 led_only×1
                    whenkey×2 seg_clear×1                          → affected: ALL FIVE
```

77 and 78 hand-scan the keypad with raw pin blocks — that is the point of those lessons
("the scan is the real thing"). Only **79-a2-sampler** authors the high-level verbs.

## 3. What the app does with an undefined opcode: it says nothing

This decides the shape of the fix, so it was executed rather than reasoned about.
`79-a2-sampler` was compiled to `.sb3` and loaded into the real `scratch-vm` twice, once
with the bundled 20-block extension registered and once with the reference 30-block copy:

```
===== BUNDLED (what lite ships, 20 blocks) =====
  loadProject threw: NO — project loaded clean
  WITHOUT a runtime function (silent no-op): stc12_seg_shownum, stc12_keypad,
                                             stc12_led_only, stc12_whenkey, stc12_seg_clear
  runtime.getIsHat("stc12_whenkey"): false
  after 60 frames, variables: {"running":"1","step":5}

===== REFERENCE (in-repo, 30 blocks) =====
  loadProject threw: NO — project loaded clean
  WITHOUT a runtime function (silent no-op): (none)
  runtime.getIsHat("stc12_whenkey"): true
```

**VM layer.** The project loads clean. `execute.js:369` pushes a block as an operation
only `if (this._definedBlockFunction)`, so a block whose opcode has no registered
function is not executed at all — it is a silent no-op, with no warning and no thread
error. Worse for the hat: `getIsHat('stc12_whenkey')` is `false`, so the two
`WHEN key N pressed` scripts **never start**. Meanwhile the green-flag script runs
normally (`running=1`, `step=5`): the LED chase animates, so the project looks alive
while the display and the keypad are dead.

**GUI layer.** `scratch-blocks/core/block.js:178` asserts on an unknown block type, but
`scratch-gui/src/containers/blocks.jsx` wraps `clearWorkspaceAndLoadFromXml` in a
`try/catch` that logs and continues — its own comment reads "The workspace is likely
incomplete. What did update should be functional." So the Blocks tab is cleared and only
partially repopulated, and the loss is reported to the browser console only.

So this is the **"blocks silently vanish"** case, not "project fails to load". Both
layers fail quietly. That is why the fix has to put the opcodes into the shipped
extension: there is no layer downstream that will complain on a learner's behalf.

## 4. Why CI never saw it — measured, not inferred

`.github/workflows/ci.yml` uses a bare `actions/checkout@v4`, so only sb3-creator is
present. Run in a sandbox with no sibling checkouts reachable:

```
ok 1 - gallery stc12 …          # SKIP gallery file not found
ok 2 - bundled stc12 …          # SKIP bundled file not found
ok 3 - reference copy …
ok 4 - copies have identical block shapes   # SKIP need two copies to compare, found reference
ok 5 - stc12live copies …                   # SKIP need two copies to compare, found reference
ok 6 - ledcube …
ok 7 - ledcube copies agree …               # SKIP need both gallery and reference copies
# pass 2   # fail 0   # skipped 5      exit code: 0
```

**Five of seven skip, and the run is green.** The only two that execute are the two that
compare in-repo files against in-repo files.

### The instrument trap this investigation hit

The first attempt at that sandbox was a git worktree under `/tmp`, and test 2 *failed*
instead of skipping. The cause: **`/tmp/lego` is a symlink to `/mnt/volume1/code/lego`**
(created 2026-08-22 20:23). `resolve(here, '../../lego/brickwright-lite/…')` from
`/tmp/<wt>/test` therefore reaches the real lite checkout. Any gate run from a worktree
under `/tmp` reads the live sibling through that symlink and reports a coverage the same
run would not have in CI. All numbers above were re-taken in a sandbox where all four
candidate sibling paths were verified absent with `existsSync` before running.

`namei -l` was also run over every component of all three copy paths: no symlinks, so
the three files compared are the real ones.
