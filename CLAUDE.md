# sb3-creator / Brickwright — project context

The compiler behind **Brickwright** (a fork of TurboWarp/scratch-gui). It turns code into
Scratch `.sb3` projects and back, in four interchangeable representations.

## Core: four representations, all two-way
**Pseudocode ⇄ blocks ⇄ Python ⇄ JavaScript**

- `src/utils/sb3Creator.js` — the compiler.
  - `parse(pseudocode)` → blocks; `decompile(project)` → pseudocode.
  - `generatePython(project)` / `generateJavaScript(project)` → code (reporter/cond/stack walkers:
    `pyRep`/`pyCond`/`pyStackBlock`, `jsRep`/`jsCond`/`jsStackBlock`).
  - `syncExtensions(project)` — derives `project.extensions` (+ `extensionURLs`) from the opcodes
    actually used. Runs at the end of `parse()` and in `generateSB3()`. Both directions:
    auto-adds extensions the code needs, and parses which are used in existing blocks.
- `src/utils/pythonToPseudocode.js` / `javascriptToPseudocode.js` — front-end parsers
  (tokenizer + Pratt) → shared `Translator` (exported from pythonToPseudocode.js) → pseudocode →
  `parse()`. This is how Python/JS become two-way.

## Invariants (keep these true — they have tests)
- Every example EXECUTES with no runtime error (`test/exec.test.mjs`).
- All examples transpile pseudocode→{blocks,pseudocode,python,js} and recompile (`test/roundtrip`).
- Round-trips CONVERGE to a fixed point under multiple permutation orders (`test/transparency`).
  A non-converging example means a construct is non-idempotent (e.g. the `delete item N`→`delete N`
  grammar bug). 
- `# comments` survive as native Scratch block comments (`test/comments.test.mjs`).
- Extension blocks transpile to runnable code (`test/extensions.test.mjs`).

Run tests: `node --test test/<file>.test.mjs` (the full `npm test` includes slow browser/exec
suites and can exceed a 3-min limit — run files individually while iterating).

## Extensions (source of truth)
Brickwright's gallery extensions are NOT bundled in the fork; they load at runtime from
`crispstrobe.github.io/extensions/generated-metadata/extensions-v0.json` (117 of them), sourced
from **github.com/CrispStrobe/extensions** (`extensions/CrispStrobe/*.js`). Canonical copies are
pinned in `reference/extensions/`. Codegen maps their opcodes to Python/JS in
`pyRep`/`jsRep`/`pyCond`/`jsCond`. **Done:** `planetemaths` (pure math; note the boolean opcode
NAMES are misnomers — map by the implementation, `gt` = `NUM1 < NUM2`). **Next:** `arrays`
(named-array registry), `gamepad` (runtime input).

## Fork integration
Compiler is VENDORED into the fork (`github.com/CrispStrobe/brickwright`, branch `develop`) at
`src/lib/sb3-creator{,-examples,-python,-javascript}.js` via `scripts/sync-sb3creator.mjs` — run it
after every compiler change. The editor UI is `src/components/tw-pseudocode/pseudocode-importer.jsx`
(3 language tabs; the top-level tab is "Code", blocks tab is "Blocks"). Push to `develop`
auto-deploys to crispstrobe.github.io/brickwright (Actions) and brickwright.vercel.app (Vercel).
Full design + roadmap: `PLAN.md` §22.
