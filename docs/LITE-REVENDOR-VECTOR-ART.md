# What brickwright-lite's next re-vendor of sb3-creator must do

Written 2026-08-29 (fab-sbx), in sb3-creator because the change that makes it
possible lives here. **Nothing in lite was edited by this lane** — this is a
specification for whoever runs the next `scripts/sync-sb3creator.mjs`.

## The situation this ends

lite carried **112 non-upstream lines** on its vendored copy of
`src/utils/sb3Creator.js`. A plain re-vendor overwrote them, and the vendor
could not tell: every relative import the sync left behind still resolved,
because there were none. The first symptom was fourteen `pseudocode-game-examples`
tests failing with `Unknown SHAPE "art"`, three commits and one push later.

`LOCAL_FILES` in `scripts/sync-sb3creator.mjs` became a tripwire for the single
import edge that WAS visible — `sb3-creator.js` importing
`./sb3-creator-vector-art.js` — and its own comment says the real fix is
upstreaming the dialect. That is now done, in sb3-creator `fdb1334`.

## What is upstream now

| was downstream | now |
|---|---|
| `SHAPE art <name>`, `COSTUME <n> art <a>`, `BACKDROP <n> art <a>` | upstream, with round-trip and refusal tests |
| the 246-entry SVG registry | **still lite's**, and correctly so |
| `arcade` / `pybadge` / `pybadge-lc` / `samd51` in SPOKEN, LAST, RETARGET_POOLS, I2C_PINS, STC_PARTS | upstream |
| the `virtual: true` pool flag and its warning | upstream |
| the `samd51` clock arm (120 MHz) | upstream |
| the widened PIN regex (`P[A-D]\d+`, `SDA`, `SCL`) | upstream |
| the deleted `runs MicroPython — no C retarget` refusal | upstream — deleted here too, as dead code, with a test pinning what actually happens |

The verb is upstream; the **artwork is not**, deliberately. A game gallery's
246 hand-drawn sprites are a product decision, not a transpiler feature, and
vendoring them here would grow the compiler by a megabyte of one app's
illustrations. `SB3Creator._vectorArt` therefore starts EMPTY and a host
injects its own. That split is what makes the next sync safe: there is no
longer a downstream patch for it to eat.

## The three steps, in order

### 1. Re-vendor normally

```
node scripts/sync-sb3creator.mjs --dir /path/to/sb3-creator
```

The vendored `sb3-creator.js` will **no longer contain**
`import {getVectorArt} from './sb3-creator-vector-art.js';` — that line was the
downstream patch, and losing it is now correct rather than a defect. Expect the
sync to REFUSE at this point with `DOWNSTREAM DIALECT LOST:
sb3-creator-vector-art.js is imported by nothing after this sync`. That refusal
is the tripwire doing its job on a change it was not written to expect. Do step
2 before believing it.

### 2. Register the art, in lite

`overlay/scratch-gui/src/lib/sb3-creator-vector-art.js` **stays** — it is
lite's own content and nothing upstream wants it. What changes is who imports
it. Add a side-effect module beside it, e.g.
`overlay/scratch-gui/src/lib/sb3-creator-register-art.js`:

```js
// lite's authored game art, injected into the transpiler's registry. The VERB
// (`SHAPE art …`) is upstream; the ARTWORK is ours. Registration is global and
// idempotent, so importing this for side effect from every entry point that
// parses pseudocode is safe and is the point.
import SB3Creator from './sb3-creator.js';
import art from './sb3-creator-vector-art.js';

SB3Creator.registerVectorArt(art);
```

Import it for side effect from **all three** places that construct an
`SB3Creator`, not only the importer — a game program can reach the debug runner
without the importer having mounted:

- `overlay/scratch-gui/src/components/tw-pseudocode/pseudocode-importer.jsx`
- `overlay/scratch-gui/src/components/tw-pseudocode/circuit-tab.jsx`
- `overlay/scratch-gui/src/lib/bw-debug/debug-runner.js`

The default export of `sb3-creator-vector-art.js` is already the
`{name: svg}` map `registerVectorArt` accepts, so no reshaping is needed. Its
`getVectorArt` / `vectorArtNames` exports may stay for
`test/game-touch-controls.test.js`, which imports them directly.

### 3. Shrink `LOCAL_FILES` to zero, and keep the mechanism

```js
const LOCAL_FILES = [];
```

**Zero, with no stated remainder.** After step 2, no vendored file imports a
downstream-only module, so the forward check has nothing to whitelist and the
reverse orphan check has nothing to watch.

Do NOT delete the reverse check itself. It is the only thing that can see a
silently-eaten downstream delta, it cost a day to learn, and the next
downstream module will want it. With an empty list it is inert, not gone.

## How to know it worked

- `pseudocode-game-examples.test.mjs` green — especially
  `'quality-approved game has authored SVG art and explicit onboarding'`, which
  reaches into `creator.assets` and asserts on the SVG BYTES (`SKYLINE SWOOP`,
  `12 CLEAN LAUNCHES WIN`), so it fails on content and not merely on count.
- `game-touch-controls.test.js` green — it imports the art module directly and
  would keep passing even if registration were forgotten, so it is **not**
  sufficient on its own. That false green is exactly what the tripwire exists
  to compensate for.
- Grep the built bundle for `Unknown SHAPE` — it should appear only as the
  warning text, never in output.
- `SB3Creator.vectorArtNames().length` should be **246** at runtime (measured
  2026-08-29 against lite `origin/main`). Zero means step 2 did not run before
  the first parse.

## This was verified against lite's real content, not a synthetic case

Run here on 2026-08-29, with sb3-creator at the commit that upstreams the verb
and lite at `origin/main`: register lite's actual
`sb3-creator-vector-art.js` default export into the UPSTREAM `SB3Creator`, then
parse every one of lite's game examples.

```
registered art entries: 246
game examples:          37
parsed with no art warning: 37 / 37
sky_skim svg assets: 8 | has SKYLINE SWOOP: true
```

The last line is the one that matters most: it is the same byte-level check
lite's `'quality-approved game has authored SVG art and explicit onboarding'`
test makes, reaching into `creator.assets` for the authored SVG text rather
than counting costumes. So the upstream verb bakes lite's own artwork into the
project exactly as the downstream patch did.

## Two findings for lite that are NOT part of this

1. **The deployed DRC cannot sum chip current.** `circuit-tab.jsx`'s
   `setEngine({…})` does not pass `getMaxCurrent` or `PORT_LIMITS`, and
   bw-circuit-ui's `drc.js` falls back to `getMaxCurrent: () => null`
   ("unknown = cannot sum") when they are absent. sb3-creator's
   `ENGINE_SURFACE` was kept faithful to that rather than quietly "fixing" it,
   because a gate that injects what production does not is how two wrong
   verdicts were reached. Whether the app SHOULD pass them is lite's call.
2. **A `74hc595` now keeps its identity.** bw-circuit-ui `14efc75` stops
   aliasing it onto the power-less built-in `shift_register`. Nothing moves
   electrically (measured: net counts and LED brightness identical across all
   42 corpus files naming either kind), but the part declares 35 terminals
   instead of 12, so the pin chooser, the schematic stubs and the BOM all see
   its vcc/gnd. Worth knowing when the next bw-circuit-ui vendor lands.
