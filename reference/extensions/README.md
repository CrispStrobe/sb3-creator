# Extension sources kept in-repo (read-only reference)

Copies of Brickwright's gallery extensions, used as the reference for their opcodes and
semantics when mapping them to Python/JavaScript in the codegen (`src/utils/sb3Creator.js` —
`pyRep`/`jsRep`/`pyCond`/`jsCond`), and consumed by `scripts/gen-runtime-registry.mjs`.

Nominal origin: **github.com/CrispStrobe/extensions** → `extensions/CrispStrobe/*.js`.
The fork loads the registry at runtime from
`crispstrobe.github.io/extensions/generated-metadata/extensions-v0.json`
(`extension-library.jsx`; URL = `https://crispstrobe.github.io/extensions/${slug}.js`).

## These are not all copies, and re-fetching is not always safe

**`MANIFEST.json` is the record — read it before touching anything here.** It carries, per
file, the sha256 of the in-repo copy, the upstream commit it relates to, upstream's own
sha256, and the RELATIONSHIP. Regenerate with
`BW_EXTENSIONS=… node scripts/vendor-reference-extensions.mjs --write`;
`test/reference-extensions-provenance.test.mjs` checks it with no checkout at all.

| relationship | what it means | is re-fetching safe? |
|---|---|---|
| `identical` | byte-equal to upstream at `upstreamCommit` | yes — it is a no-op |
| `local-ahead` | this repo has work upstream does not | **no — it DELETES that work** |
| `local-behind` | upstream has work this repo does not | yes, deliberately |
| `not-upstream` | no file of that name upstream | n/a — the origin line does not apply |

As recorded on 2026-08-24, of the 8 files here: **6 `identical`, 1 `local-ahead`, 1 `not-upstream`.**

- **`stc12.js` is `local-ahead`** — 24,467 bytes here against 10,335 upstream. It carries the
  `keypad` reporter and the whole SEVENSEG8 surface (`seg_shownum`, `seg_showdigit`, …) that
  upstream has not received. `test/stc12-conformance.test.mjs` treats **this** file as canonical.
  Re-fetching it would silently delete the opcodes that gate exists to track.
- **`devices.js` is `not-upstream`** — it has no counterpart in `extensions/CrispStrobe/` at all.

An earlier version of this file called every one of these a "pinned" and "canonical" copy while
recording no commit, hash or date for any of them, and instructed the reader to "re-fetch from
the repo above" to refresh. For `stc12.js` that instruction was destructive. The word "pinned"
is now backed by `MANIFEST.json` or it is not used.

## The three with hand-written codegen mappings

| file | id | name | codegen |
|------|----|------|---------|
| `planetemaths.js` | `planetemaths` | Planète Maths | ✅ mapped (pure math; also pseudocode syntax) |
| `arrays.js` | `arrays` | Arrays & Vectors | ✅ core ops mapped (0-based, `_arrays` registry) |
| `gamepad.js` | `universalgamepad` | Gamepad | ✅ neutral `_gamepad` shim (live in VM) |

The other five (`circuit.js`, `devices.js`, `ledcube.js`, `stc12.js`, `stc12live.js`) reach the
compiler through `scripts/gen-runtime-registry.mjs` rather than by hand.

Note the Gamepad extension **id is `universalgamepad`** (not `gamepad`), so its opcodes are
`universalgamepad_*` and the file at the URL is `gamepad.js`.

**Gotcha:** in `planetemaths.js` the boolean opcode *names* are misnomers — `gt` computes
`Cast.compare(NUM1, NUM2) < 0`, i.e. **NUM1 < NUM2**. Always map by the method body, not the
opcode name or the (localized) display label.

**To refresh a file:** check its `relationship` in `MANIFEST.json` first. Only `identical` and
`local-behind` are refreshable from upstream. Then re-record with
`scripts/vendor-reference-extensions.mjs --write`, in the same commit.
