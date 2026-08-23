# Gate inventory: what every test file actually promises

Wave 2 of the gate-integrity campaign, 2026-08-23. Wave 1 asked *which gates never
run* and closed it (`test/CROSS-REPO-GATE-AUDIT.md`). This wave asks the question
that survey ended on, and could not answer with its own instruments:

> Neither the skip-sweep nor the static detector can see a test that iterates a
> discovered list which is empty — it neither skips nor fails, it passes having
> checked nothing.

Every row below carries four facts: **does it run**, **does it skip and on what**,
**does it assert anything that could be false**, and **does it open a corpus with a
floor under it**. The tables are generated — `node scripts/gate-inventory.mjs
--markdown` — so they cannot drift from the tree the way a hand-written audit does.

## The instruments, and why there are two

**`scripts/gate-inventory.mjs`** is a static screen. It parses each file with acorn
rather than grepping it, because GNU grep stops silently at a NUL byte and an
absence is the answer every broken instrument returns by default — a rule this
project earned. (It earned it again during this audit: a stray NUL in the first
draft of the screen made `grep -n hasNul` return *nothing at all* for the file that
contained the word twice.) It refuses to follow a symlink out of the tree it was
pointed at, because a scan resolving through `/tmp/lego` reports another session's
coverage as this one's.

The screen distinguishes a **corpus** from a **table**. `for (const c of CASES)`
where `CASES` is a literal a few lines up cannot arrive empty without an edit
visible in the diff; an imported map, a `readdirSync`, or a parsed manifest can,
silently, from another file or another repo. Only the second kind is flagged, or
the sweep drowns in tables — the first version, which did not draw that line,
reported 28 suspects of which most were `const CASES = [...]`.

**`scripts/starve-gate.mjs`** is the authority. It empties the corpus a gate opens
and reads the verdict: RED means the gate noticed, GREEN means it passed over
nothing. A screen flag is a **suspect**; only a starve makes it a finding. That
distinction earned its keep immediately — `transparency.test.mjs` was flagged and
cleared, because its last test names `snake`/`sokoban`/`breakout` literally and
throws on `undefined`. It was not vacuous; it was guarded by accident, which is a
different thing to write down.

Every starve must **change an observable**. A green result has two causes — the
gate is vacuous, or *the starve never applied* — and only the first is a finding.
So the gate's subtest count must drop, or the run reports `INSTRUMENT-FAILED` and
claims nothing in either direction. Module corpora are starved by swapping the
**import path** through a `module.register()` resolve hook, never by editing the
corpus file: an edit made through a symlink lands in a sibling repo and reads as
robustness. This is the rule wave 1 wrote down after three false readings, and it
caught one here — see "the mutation that lied", below.

---

## Findings

### 1. CI on `main` had produced no verdict at all for seven commits — CRITICAL

`gh run list --branch main` showed **seven consecutive failures**, from `44531a8`
(2026-08-23 13:19 UTC) to `1a83dfa` (16:10 UTC). The last green run was `ab243ca`
at 13:16. Every one failed at the same place — step two, before `npm ci`:

```
Lint · test · build   Check out bw-board (pinned)
[command]/usr/bin/git -c protocol.version=2 fetch --no-tags --prune \
  --no-recurse-submodules --depth=1 origin +refs/heads/50c3bf7*:refs/remotes/origin/50c3bf7*
The process '/usr/bin/git' failed with exit code 1
Waiting 10 seconds before trying again
...
##[error]The process '/usr/bin/git' failed with exit code 1
```

Read the refspec: `refs/heads/50c3bf7*`. `actions/checkout` recognises a ref as a
**commit** only at the full forty hex characters; anything shorter it treats as a
branch or tag and fetches as a branch glob, which matches nothing. The pins were
written as seven-character abbreviations.

So lint, the entire 6403-test suite, the mutation prover and the build did not run
at all while seven commits landed on `main`.

The bitter part is where it came from. This is `90391a6` — *the wave-1 fix* for
"fifteen cross-repo gates skip in CI and a skip reads as a pass". It replaced
fifteen silent skips with one total blackout. That is, at least, the better
failure: it was loud, a red X on every run, and it went unactioned for three hours
anyway.

**Why the existing gate did not catch it.** `gate-integrity` had a test asserting
that `ci.yml`'s `ref:` values *equal* `test/fixtures/siblings.json`'s. They did.
Both were abbreviated, both were unfetchable, and the two agreed with each other
perfectly. **Agreement is not fetchability** — the check compared the two copies
instead of asserting the property either had to satisfy.

**Fixed:** full 40-character SHAs in both files, and a new gate,
`every pinned checkout ref is a ref actions/checkout can actually fetch`, which
asserts the length on the file CI reads, and asserts its own yield first so an
empty scan cannot read as a clean one.

### 2. `device-coverage` has never seen the live engine in CI — 36 kinds unchecked

The gate exists so that "bw-board adds a device kind and nobody adds blocks for it"
is a red build. It located bw-board as `resolve(here, '../../bw-board/src/board.js')`
and **never read `BW_BOARD`**. CI checks bw-board out at `${workspace}/siblings/bw-board`
and passes the path in `BW_BOARD`, so the probe failed on every CI run and the gate
silently took its committed-snapshot branch.

Measured against `bw-board@50c3bf7`, in a rig laid out the way CI is — `BW_BOARD`
set, no `../bw-board`:

```
$ CI=true BW_BOARD=…/pinned-bw-board node --test test/device-coverage.test.mjs   # origin/main
#   device coverage: 36/82 covered, 46 known gaps
ok 1 - device block coverage (snapshot — 82 kinds)
```

The live engine models **118** kinds. The snapshot lists **82**. Thirty-six kinds —
`74hc283`, `keypad_4x4`, `soil_moisture`, `clock_display`, `pcf8574`, `relay_dpdt`
and thirty more — have never been checked for block coverage in CI, for the life of
the file.

The gate did put `(snapshot)` in the test name, which is the honest half. What it
could not do was ever run the other branch, in the one place it mattered.

Note what the defect was *not*: the number of dots was correct. `../..` from
`test/` **is** the sibling directory. The defect was ignoring `BW_BOARD`, which is
the pointer CI actually uses. The existing "no test resolves a sibling two levels
up" detector would have been wrong to flag it — and in fact could not see it at
all, because it matched only the `join(x, '..', '..', 'name')` array spelling and
this was a string. Both halves are now fixed: the detector reads the base together
with the dots and judges the resolved location, and it strips comments first.

**Fixed:** the gate uses `locate()`, and in CI the snapshot branch is itself a
failure. RED evidence in "Proofs", below.

### 3. `bench-invariants` built a 1092-file corpus with no floor under it

The file whose verdict is `assert.deepEqual(problems, [])` over a list assembled by
walking `examples/`. Empty the directory and every invariant in it passes, under a
test name that says so truthfully:

```
$ (examples/ emptied, origin/main)
    ok 2 - all 0 benches: engine accepts, peripherals reachable from the MCU
```

This is finding #4 of `GATE-AUDIT-REPORT.md` recurring at a larger scale: there,
the filename regex matched only the device-suffixed benches and 215 primary
`circuit.json` files went unchecked while the gate stayed green. The floors are
therefore **split** — total, primary, device-suffixed — because a total alone would
still be satisfied by the 870 suffixed files if the primary ones vanished again.
Measured 2026-08-23: 1092 files over 275 example directories, 222 primary and 870
suffixed. The 239 part sidecars are floored too; without them terminal aliases stop
resolving and the reachability invariant quietly stops accepting what it exists to
accept.

### 4. Three of the four named invariants were satisfiable by an empty map

`exec`, `roundtrip` and `transparency` generate their subtests from
`src/utils/examples.js` (35 examples, 30 non-hardware). With that map empty they
emit zero subtests each. `transparency` was saved by accident, as described above;
`exec` and `roundtrip` were not.

Also floored, all measured on 2026-08-23 and all derived rather than written down:
`curriculum` (53 stations across 5 trails), `debug-micropython` (9 examples matched
by `/DEVICE\s+MICROBIT/i` over program text), `debug-trace-audit` (16),
`retarget-amplification` (40), `extensions` (19 runtime extensions, 775 ops),
`cube-directions` (6), `micropython-pico-roundtrip` (19 PINs),
`multimeter-chain` (239 sidecars).

Several of these are discovered **by regex over program source**. Rename a
declaration keyword and the list empties without anyone touching the test.

### 5. `main` is red on the pinned siblings, independently of CI being down

Run here against the exact revisions `ci.yml` pins — `bw-board@50c3bf7`,
`bw-circuit-ui@d754cfc` — `origin/main` gives **6403 tests, 6297 pass, 14 fail, 92
skipped**. Two of the failures are a real physics disagreement and are not this
lane's:

```
not ok 1 - net pot1.wiper = 2.03 V +-0.05
  error: '41-pot-as-dimmer: net pot1.wiper = 2.5000 V, expected 2.03 +-0.05 V (off by 0.4700)'
not ok 2 - no net sources or sinks current it cannot account for
  + '41-pot-as-dimmer/circuit.json net bb1:n-col-t5 (2.5000 V): residual -2.1739 mA across [pot1.wiper r1.a]'
```

That is exactly the loaded-potentiometer artifact `kcl-residual.test.mjs`'s own
header describes: an unloaded midpoint returned while the load chain draws 2.17 mA
through it. It reproduces identically against the live `bw-board@b1da99e`, so it is
not a stale pin — the defect is live in both. **`kcl-residual` is working perfectly
and nobody has seen it, because CI has not run since it landed.** Raised here, owned
elsewhere.

The other twelve are environment, and are named so nobody mistakes them for
signal: `example-corpus-contract` and `generated-bench-layout` need `fs.globSync`
(Node 22; this box has 20), and eight `syntactically valid Python` failures are
`spawnSync /bin/sh ETIMEDOUT` — a five-second ceiling on a loaded box, not a
defect.

### 6. Two instrument hazards in the shared tree, for whoever owns them

Neither is mine to fix; both cost time here and will cost it again.

**`bw-board` tracks `node_modules` as a symlink to an absolute macOS path.**
`git cat-file -p` on the tracked blob returns `/Users/christianstrobele/code/bw-board/node_modules`,
mode `120000`. Every clone and every worktree on Linux gets a dangling symlink, and
`avr8js` then resolves from nowhere:

```
error: "Cannot find package 'avr8js' imported from …/bw-board/src/avr8js-adapter.js"
```

sb3-creator's CI survives it by accident — bw-board is checked out *inside* the
workspace, so resolution walks past the dangling link and finds the root
`node_modules`. A sibling checkout beside the repo, which is what every developer
has, does not.

**`/mnt/volume1/code/wt/` is a shared worktree pool containing `bw-board`.** A
worktree there resolving `../bw-board` lands in another session's tree at whatever
revision it happens to hold — `caeac2b` during this audit, neither the pin nor
`bw-board`'s HEAD. Every measurement in this document therefore sets `BW_BOARD` and
`BW_CIRCUIT_UI` explicitly at detached worktrees pinned to `50c3bf7` / `d754cfc`.
Anything measured in that pool without those variables is measuring someone else's
checkout.

---

## The mutation that lied, and what it cost

The first starve of `bench-invariants` reported the gate as already RED on an empty
corpus — which would have meant no repair was needed. Suspecting the mutation was
the right move:

```
    not ok 1 - engine + sidecars load
      error: "Cannot find package 'avr8js' imported from …/pinned-bw-board/src/avr8js-adapter.js"
    ok 2 - all 0 benches: engine accepts, peripherals reachable from the MCU
```

The suite went red on a missing package. The line that mattered was the one under
it, passing over zero benches. Had the starve reported only its exit code, it would
have cleared a vacuous gate on the strength of an unrelated failure — the same
family as wave 1's "A/B whose comparison side had an empty device registry".

Two rules came out of it, both now in the tooling. **Read the assertion, not the
exit code** — `starve-gate.mjs` records the subtest counts either side and reports
them with every verdict. And **do not run a directory-starve while a suite run is
in flight**: the starve renames `examples/` aside, and any concurrent reader sees
an empty gallery. `starve-gate.mjs` only ever touches paths inside its own `ROOT`,
verified with `realpathSync` against a symlink, which is why the full-suite baseline
running in a second worktree was unaffected — but that was design, not luck, and it
is worth keeping.

---

## What the screen misses, measured rather than asserted

The screen asks whether a **file** asserts any measured minimum. It does not ask
whether that minimum is on the corpus the file's subtests are generated from, and
the difference is not academic:

```
$ node --input-type=module -e "import {analyseFile} …"   # against origin/main
test/exec.test.mjs       -> floors: ["44: assert.equal(logs.filter((l) => l === 'Correct!').length, 2)"]
test/roundtrip.test.mjs  -> floors: ["54: …length, 2, …", "73: …length, 1, …"]
test/transparency.test.mjs -> floors: []
```

`exec` and `roundtrip` read as **floored** on the strength of an assertion about a
sandbox's log output, in a different test, having nothing to do with the examples
map their subtests are generated from. Both were in fact satisfiable by an empty
map. The screen missed them; `starve-gate.mjs` did not. That is why the starve is
the authority and the screen is only a filter.

The stricter question — does a floor **name** the corpus it covers? — is
implemented (`unflooredCorpora()`, reachable with `--strict`) and deliberately
**not enforced**. Run it over this tree:

```
$ node scripts/gate-inventory.mjs --strict
  --- strict (floor must name the corpus): 29 ---
```

Twenty-nine of eighty-eight, nearly all because a corpus is reached through a loop
variable or a rename that no name-match can follow. A gate demanding a 27-entry
waiver list will get one, and then the waiver list is the artefact nobody reads —
which is precisely the rot this campaign exists to stop. So the enforced gate stays
coarse, its limit is written here, and the gates whose corpora actually matter are
covered by name in `scripts/starve-gate.mjs`, where the question is asked by
emptying the corpus instead of by reading the source.

### The detector, run against `origin/main`

The "before" measurement, produced by the new gate itself:

```
not ok 6 - no gate opens a corpus without a measured floor under it
  these gates iterate a corpus with nothing asserting the corpus is non-empty, so
  they pass over an empty one:
    test/bench-invariants.test.mjs — opens [readdirSync(join(CUI, 'src/parts-data')),
      readdirSync(EXAMPLES, { withFileTypes: true }), readdirSync(join(EXAMPLES, dir.name))]
    test/cube-directions.test.mjs — opens [CUBE_DIRECTIONS, CUBE_DIRECTIONS.entries()]
    test/curriculum.test.mjs — opens [ch.stations, cur.trails, t.chapters]
    test/debug-micropython.test.mjs — opens [mbExamples, normalVars, vnames]
    test/debug-trace-audit.test.mjs — opens [mpExamples]
    test/micropython-pico-roundtrip.test.mjs — opens [authored]
    test/multimeter-chain.test.mjs — opens [readdirSync(join(CUI, 'src/parts-data')), …]
    test/retarget-amplification.test.mjs — opens [entry.devices, generic]
    test/transparency.test.mjs — opens [Object.keys(examples).filter((n) => !HARDWARE.has(n))]
```

Nine by the screen, plus `exec` and `roundtrip` by the starve: **eleven**.

---

## Proofs

Every repair below is shown failing. A gate nobody has seen fail is a gate nobody
should trust.

### `device-coverage` — the CI-shaped rig, before and after

```
# origin/main, CI layout (BW_BOARD set, no ../bw-board):
#   device coverage: 36/82 covered, 46 known gaps
ok 1 - device block coverage (snapshot — 82 kinds)          <- green, over the snapshot

# repaired, same rig:
#   device coverage: 36/118 covered, 82 known gaps
ok 1 - the engine surface is the live one, not the snapshot
ok 2 - device block coverage (live — 118 kinds)

# repaired, CI with the bw-board checkout broken:
not ok 1 - the engine surface is the live one, not the snapshot
    CI read the snapshot device list. CI checks bw-board out at the pin in
    test/fixtures/siblings.json and passes BW_BOARD; taking the snapshot branch
    here means this gate is not looking at the engine at all, which is how 36
    kinds went unchecked for the life of this file.
  expected: 'live'
```

### `bench-invariants` — `examples/` emptied

```
# origin/main:
    ok 2 - all 0 benches: engine accepts, peripherals reachable from the MCU

# repaired:
not ok 1 - the bench corpus is actually there
      error: 'only 0 bench files found under …/examples (expected ~1092) —
               this gate is about to report a clean run over a corpus it did not open'
```

### The corpus floors — starved by import-path swap

```
$ node scripts/starve-gate.mjs
RED                test/transparency.test.mjs
   corpus present: 33 tests, exit 0
   corpus EMPTY  :  3 tests, exit 1
RED                test/roundtrip.test.mjs
   corpus present: 74 tests, exit 0
   corpus EMPTY  : 14 tests, exit 1
RED                test/gallery-roundtrip.test.mjs
   corpus present: 273 tests, exit 0
   corpus EMPTY  :   1 tests, exit 1
RED                test/circuit-json-roundtrip.test.mjs
   corpus present: 256 tests, exit 0
   corpus EMPTY  :   1 tests, exit 1
```

The subtest counts are the instrument check: the corpus demonstrably went away.

---

## Mutation proof

`scripts/mutation-prove-conformance.mjs` went from **20 mutations over 4 gates** to
**27 over 5**. Each of the seven added was run and is shown catching its defect.

| mutation | the instrument that must catch it | result |
|---|---|---|
| `ci.yml` pins a sibling by abbreviated SHA — *and* `siblings.json` is abbreviated to match, so the "the two agree" test is not what fires | `every pinned checkout ref is a ref actions/checkout can actually fetch` | `RED` |
| CI reads the committed device snapshot instead of the checked-out engine | `the engine surface is the live one, not the snapshot` | `RED` |
| a gate loses the floor under its corpus — in a file where that floor is the only one | `no gate opens a corpus without a measured floor under it` | `RED` |
| a gate loses the floor under its corpus **but keeps an unrelated one** | the **starve**, not the screen | `RED` |
| a corpus waiver outlives the file it names | the same gate, stale-waiver half | `RED` |
| the vacuity screen stops recognising corpus-driven gates | the same gate, yield assertion | `RED` |
| the examples corpus arrives empty, by import-path swap | the `corpus floor:` tests | `RED` |

Two of these are worth reading closely.

**The fourth exists because the third was a MISS.** The first draft removed
`exec.test.mjs`'s `corpusFloor` and expected the screen to notice. It did not, and
suspecting the mutation was wrong: the mutation was correct and the *gate* has the
file-granular blind spot documented above — `exec` keeps an unrelated
`assert.equal(logs.filter(…).length, 2)`, so the file stays "floored". Rather than
retarget the mutation and move on, the division of labour is now itself
mutation-proven: one mutation requires the screen to catch it, and a second
requires the screen to **miss** it and the starve to catch it. If either half ever
changes — the screen gets smarter, or the starve stops covering `exec` — the claim
in this document is stale and the prover goes red saying so.

**The last one carries its instrument check inside the mutation.** If
`BW_STARVE: swapped` is absent from the output, the red is discarded rather than
scored, because a red run that never loaded the stub proves something else
entirely.

`--only <substring>` runs a subset. A full pass is 27 mutations, each a full run of
five gates; on a box at load 21 one mutation's twelve cross-repo gates ran past ten
minutes. CI still runs the whole set — this is for proving one repair without
waiting hours, because a prover nobody runs stops being evidence.

---

## The suites

Two rigs, both with `BW_BOARD` and `BW_CIRCUIT_UI` pointed at **detached worktrees
pinned to `50c3bf7` / `d754cfc`** — the revisions `ci.yml` checks out — because
`/mnt/volume1/code/wt/` contains a shared `bw-board` worktree and a run that
resolves `../bw-board` measures whichever revision another session left there
(`caeac2b`, during this audit). Node 20 here; CI pins 22.

**`npm run test:fast`** — this branch:

```
# tests 1173
# pass 1168
# fail 0
# skipped 5
```

**`npm test`** — `origin/main` and this branch, same rig:

```
before   6403 tests   6297 pass   14 fail   92 skipped     (origin/main @ 1a83dfa)
after    6416 tests   6318 pass    6 fail   92 skipped     (test/gate-integrity-wave2)
```

`+13` tests, `+21` passing. The after-set of failures is a strict **subset** of the
before-set, so nothing here introduced one.

**Do not read `−8` as a repair.** Those eight are `spawnSync /bin/sh ETIMEDOUT` in
`debug-trace-audit`'s `syntactically valid Python` — a five-second ceiling on a box
at load 18–21, which happened not to be hit the second time. They are flakes and
the honest number for this branch's effect on failures is **zero**.

The six that remain, both runs, neither caused here:

| # | failure | cause |
|---|---|---|
| 4 | `bench file list excludes flat twins…`, `all controller benches…`, `all generated seated component bodies…`, `example-corpus-contract` | `TypeError: fs.globSync is not a function` — Node 20 on this box, Node 22 in CI |
| 2 | `absolute-physics assertions` → `41-pot-as-dimmer`, and `every solved node obeys KCL` | the loaded-potentiometer artifact, live in `bw-board` at both the pin and HEAD. PLAN.md §27. |

**`brickwright-lite`** — unchanged by this branch, run once for the record:

```
# tests 915   # pass 913   # fail 1   # skipped 1
```

The one failure is `lesson-numeric-contract`: `11 benches outran the budget — raise
it or check the box`, after 296 s. A wall-clock budget on a saturated box, not a
defect — and worth noting as a fourth shape this campaign should name: a gate whose
verdict depends on how busy the machine is will eventually be raised rather than
believed.

---

## How to read a row

- **runs** — `npm test` in this repo globs `test/*.test.mjs`, so every file here
  runs in CI. `CI + test:fast` marks the 22 files in the `test:fast` script, which
  is what people run while iterating; the other 66 are invisible until CI. Wave 1
  recorded two regressions that hid in exactly that gap.
- **skips** — the skip condition as written. A `skip` whose condition can be true
  in CI is the wave-1 defect; the shared guard in `test/helpers/siblings.mjs` turns
  those into failures when `CI=true`.
- **asserts** — assertion count, with tautological ones (`assert.ok(true)`) called
  out. `corpus-differential.test.mjs` in brickwright-lite shows `0` and is correct:
  its assertion is `execFileSync` throwing on a non-zero exit, which the file says.
- **corpus / floor** — `—` means the file's inputs are written in it. `floored`
  means something asserts a measured minimum. `NO FLOOR` names what it opens.

`NO FLOOR` on a row is a suspect, not a verdict. Two in `sb3-creator` are waived in
`gate-integrity` with a reason each, and the waiver list is itself checked for stale
entries:

- `authored-transform.test.mjs` iterates `bench.parts`, but every case first
  asserts `census[kind] === 1` on both benches — an empty parts array fails there,
  before the loop.
- `block-lowering.test.mjs` iterates `DEVICES_NO_C`, a **waiver set**. Its assertion
  is "nothing in this gap list already has a C lowering", so an empty set is the
  goal state. A floor there would forbid finishing the work.

The four in `brickwright-lite` are recorded, not fixed — that repo is outside this
worktree's write boundary. They are listed under "Open" in `PLAN.md`.

---

## The tables

Generated by `node scripts/gate-inventory.mjs --markdown` on 2026-08-23, against
`sb3-creator@test/gate-integrity-wave2` and `brickwright-lite` as checked out at
`2e294ceaf`.

### `sb3-creator` — 88 test files

| file | runs | skips | asserts | corpus / floor |
|---|---|---|---|---|
| `6502-oled-compile.test.mjs` | CI only | `!hasCl65 && 'cl65 not on PATH'` | 8<br>env: `STC_COMPILER`, `HOME` | — |
| `a2-calculator-behavior.test.mjs` | CI only | — | 12 | — |
| `a2-parts-parity.test.mjs` | CI only | — | 22 | — |
| `a2-sampler-behavior.test.mjs` | CI only | — | 12 | — |
| `arduino-import.test.mjs` | CI only | — | 4 | floored (1) |
| `assert-physics.test.mjs` | CI only | `ENGINE_SKIP`<br>``unknown assertion kind: "${a.raw}"``<br>+4 more | 19<br>env: `envVar` | floored (1) |
| `authored-transform.test.mjs` | CI only | — | 9 | **NO FLOOR** — bench.parts |
| `basic-linemap.test.mjs` | CI only | — | 15 | floored (1) |
| `basic-sweep.test.mjs` | CI only | — | 41 | floored (4) |
| `basic-trace.test.mjs` | CI only | — | 19 | — |
| `bench-invariants.test.mjs` | CI only | `gate.skip` | 5<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (4) |
| `block-lowering.test.mjs` | CI + `test:fast` | — | 6 | **NO FLOOR** — DEVICES_NO_C |
| `calculator-frame.test.mjs` | CI + `test:fast` | — | 14 | floored (1) |
| `chost.test.mjs` | CI + `test:fast` | `!HAS_CC`<br>`!(HAS_CC && HAS_PY)`<br>+2 more | 20 | floored (2) |
| `circuit-json-roundtrip.test.mjs` | CI + `test:fast` | — | 17 | floored (2) |
| `cli.test.mjs` | CI + `test:fast` | — | 7 | — |
| `codegen.test.mjs` | CI + `test:fast` | — | 15 | floored (2) |
| `comments.test.mjs` | CI + `test:fast` | — | 16 | — |
| `controller-read.test.mjs` | CI only | — | 7 | — |
| `corpus-generator.test.mjs` | CI only | — | 5<br>env: `COMPILE_TEST` | — |
| `ctarget.test.mjs` | CI + `test:fast` | `oracleSkip`<br>`galleryReachable ? false : 'gallery unreachable'`<br>+1 more | 819<br>env: `STC_COMPILER_URL`, `BW_GALLERY`, `BW_LITE_STC12` | floored (17) |
| `cube-directions.test.mjs` | CI only | — | 16 | floored (1) |
| `curriculum.test.mjs` | CI only | — | 5 | floored (2) |
| `debug-micropython.test.mjs` | CI only | — | 17 | floored (1) |
| `debug-trace-audit.test.mjs` | CI only | — | 13 | floored (1) |
| `decompile.test.mjs` | CI + `test:fast` | — | 20 | floored (1) |
| `device-coverage.test.mjs` | CI + `test:fast` | — | 6 | floored (3) |
| `emitter-decompiler-symmetry.test.mjs` | CI only | — | 1 | — |
| `example-corpus-contract.test.mjs` | CI only | `gate.skip` | 9<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (3) |
| `exec.test.mjs` | CI only | — | 4 | floored (2) |
| `extension-coverage.test.mjs` | CI + `test:fast` | — | 8 | floored (2) |
| `extensions.test.mjs` | CI + `test:fast` | — | 81 | floored (2) |
| `features.test.mjs` | CI + `test:fast` | — | 68 | — |
| `flat-variants-manifest.test.mjs` | CI only | — | 13 | floored (1) |
| `flat-variants.test.mjs` | CI only | `gate.skip` | 4<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (2) |
| `gallery-e2e.test.mjs` | CI only | `SKIP`<br>`SKIP`<br>+7 more | 62<br>env: `envVar` | floored (9) |
| `gallery-roundtrip.test.mjs` | CI + `test:fast` | — | 4 | floored (2) |
| `gallery.test.mjs` | CI only | `!hasProgram`<br>`!hasProgram`<br>+7 more | 34 | floored (3) |
| `gate-canary.test.mjs` | CI only | `gate.skip` | 11<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | — |
| `gate-integrity.test.mjs` | CI + `test:fast` | `gate.skip` | 27<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (6) |
| `generatec-passed-project.test.mjs` | CI only | — | 4 | — |
| `generated-bench-layout.test.mjs` | CI only | `layoutGate.skip` | 6<br>env: `BW_CIRCUIT_UI` | floored (2) |
| `js-driver-oled-chain.test.mjs` | CI only | `gate.skip` | 7<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (2) |
| `kcl-residual.test.mjs` | CI only | `available ? false : 'needs bw-circuit-ui/bw-board checkouts'` | 6<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (3) |
| `keypad-multicore.test.mjs` | CI only | — | 41 | — |
| `keypad-parity.test.mjs` | CI only | — | 49 | — |
| `lcd-cgen.test.mjs` | CI only | — | 7 | — |
| `lfs-image.test.mjs` | CI only | `lfsUnavailable`<br>`lfsUnavailable` | 4 | — |
| `live.test.mjs` | CI + `test:fast` | — | 18 | floored (3) |
| `matrix-cgen.test.mjs` | CI only | `t.skip('sdcc not installed')` | 51 | — |
| `matrix-keypad-retarget.test.mjs` | CI only | `!hasCl65 && 'cl65 not on PATH'` | 24 | — |
| `matrix-paint.test.mjs` | CI only | `!hasSdcc()` | 11 | — |
| `microbit-oracle.test.mjs` | CI only | — | 17 | — |
| `microbitplus-actuators.test.mjs` | CI only | — | 3 | — |
| `microbitplus-display.test.mjs` | CI only | — | 5 | — |
| `microbitplus-examples.test.mjs` | CI only | — | 10 | — |
| `microbitplus-lesson.test.mjs` | CI only | — | 5 | — |
| `microbitplus-pins.test.mjs` | CI only | — | 2 | — |
| `microbitplus-radio.test.mjs` | CI only | — | 4 | — |
| `microbitplus-sensors.test.mjs` | CI only | — | 7 | — |
| `micropython-debug.test.mjs` | CI only | — | 45 | floored (2) |
| `micropython-pico-roundtrip.test.mjs` | CI only | — | 22 | floored (1) |
| `micropython.test.mjs` | CI only | — | 23 | floored (1) |
| `multimeter-chain.test.mjs` | CI only | `skipReason`<br>`skipReason` | 14<br>env: `BW_CIRCUIT_UI`, `BW_BOARD`, `EMU8051_JS` | floored (2) |
| `not-precedence.test.mjs` | CI only | — | 5 | — |
| `oled-cgen.test.mjs` | CI only | — | 28 | — |
| `oled-flush.test.mjs` | CI + `test:fast` | — | 23 | — |
| `p5-cgen.test.mjs` | CI only | — | 12 | — |
| `pico-oled-chain.test.mjs` | CI only | `skipReason` | 9<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (4) |
| `pico-repl.test.mjs` | CI only | — | 5 | — |
| `rail-short.test.mjs` | CI only | `gate.skip` | 6<br>env: `BW_CIRCUIT_UI`, `BW_BOARD` | floored (2) |
| `retarget-amplification.test.mjs` | CI only | — | 8 | floored (1) |
| `retarget-gallery.test.mjs` | CI only | — | 11 | floored (1) |
| `retarget.test.mjs` | CI only | — | 34 | — |
| `roundtrip.test.mjs` | CI + `test:fast` | — | 49 | floored (3) |
| `settrace-codegen.test.mjs` | CI only | `!hasPython`<br>`!hasPython`<br>+1 more | 34 | floored (3) |
| `shape-coverage.test.mjs` | CI + `test:fast` | — | 3 | floored (2) |
| `spikeprime-roundtrip.test.mjs` | CI only | — | 23 | — |
| `stc-persistence.test.mjs` | CI only | — | 11 | — |
| `stc12-conformance.test.mjs` | CI + `test:fast` | `!snap.live && `no ${snap.source.repo} checkout on this machine —` | 20 | floored (5) |
| `tft-cgen.test.mjs` | CI only | — | 26 | — |
| `trace-oracle.test.mjs` | CI only | — | 94 | — |
| `transparency.test.mjs` | CI + `test:fast` | — | 7 | floored (1) |
| `ttl-module-acceptance.test.mjs` | CI only | `skipReason \|\| (!existsSync(join(circuitsDir, 'PC.dig')) && 'PC`<br>`skipReason \|\| (!existsSync(join(circuitsDir, 'MAR.dig')) && 'M`<br>+2 more | 27 (1 tautological)<br>env: `DIGITAL_JAR`, `BW_TTL_ORACLE` | — |
| `uf2.test.mjs` | CI only | — | 11 | — |
| `unit.test.mjs` | CI + `test:fast` | — | 61 | floored (3) |
| `vm.test.mjs` | CI only | — | 49 | floored (16) |
| `z80-calculator-retarget.test.mjs` | CI only | `!hasSdcc && 'sdcc not on PATH'` | 27 | — |

88 files; 47 corpus-driven, 45 floored, 2 without a floor.

### `brickwright-lite` — 61 test files

| file | runs | skips | asserts | corpus / floor |
|---|---|---|---|---|
| `about-data.test.mjs` | CI (`npm test`) | — | 6 | — |
| `app-store-metadata.test.mjs` | CI (`npm test`) | — | 11 | — |
| `board-label-geometry.test.mjs` | CI (`npm test`) | — | 2 | — |
| `board-pin-functions-data.test.mjs` | CI (`npm test`) | — | 9 | — |
| `breadboard-geometry.test.mjs` | CI (`npm test`) | — | 3 | — |
| `circuit-corpus-invariants.test.mjs` | CI (`npm test`) | — | 4 | floored (1) |
| `circuit-declarations.test.mjs` | CI (`npm test`) | — | 5 | — |
| `circuit-designer-ux-contract.test.mjs` | CI (`npm test`) | — | 67 | — |
| `circuit-hit-test.test.mjs` | CI (`npm test`) | `FOOTPRINTS.mcu ? false : 'FOOTPRINTS.mcu removed in bw-circuit-u` | 18 | — |
| `circuit-rendering-regressions.test.mjs` | CI (`npm test`) | — | 21 | — |
| `circuit-tab-index.test.mjs` | CI (`npm test`) | — | 3 | — |
| `codemirror-editor.test.mjs` | CI (`npm test`) | — | 19 | — |
| `condition.test.mjs` | CI (`npm test`) | — | 41 | — |
| `controller-board-face.test.mjs` | CI (`npm test`) | — | 11 | — |
| `controller-integration.test.mjs` | CI (`npm test`) | — | 14 | — |
| `controller-panel.test.mjs` | CI (`npm test`) | — | 207 | — |
| `controller-variables.test.mjs` | CI (`npm test`) | — | 10 | — |
| `corpus-differential.test.mjs` | CI (`npm test`) | `!enabled && 'CORPUS_DIFFERENTIAL not set'` | 0<br>env: `CORPUS_DIFFERENTIAL` | — |
| `debug-target-routing.test.mjs` | CI (`npm test`) | `existsSync(factoryPath) ? false : 'not integrated'`<br>`existsSync(factoryPath) ? false : 'not integrated'`<br>+5 more | 14 | **NO FLOOR** — kinds |
| `debug-target-selection.test.mjs` | CI (`npm test`) | — | 5 | — |
| `declared-pins-wired.test.mjs` | CI (`npm test`) | — | 22 | floored (2) |
| `default-costume-centre.test.mjs` | CI (`npm test`) | — | 5 | floored (1) |
| `eater6502-examples.test.mjs` | CI (`npm test`) | — | 16 | — |
| `example-bench.test.mjs` | CI (`npm test`) | — | 6 | — |
| `example-execution.test.mjs` | CI (`npm test`) | — | 17 | floored (3) |
| `example-vm-execution.test.mjs` | CI (`npm test`) | — | 39 | floored (10) |
| `faceplate-thermostat.test.mjs` | CI (`npm test`) | — | 10 | — |
| `infer-board-netlist.test.mjs` | CI (`npm test`) | — | 3 | — |
| `l10n-parity.test.mjs` | CI (`npm test`) | — | 11 | — |
| `lesson-bench-claims-wave2.test.mjs` | CI (`npm test`) | — | 24 | — |
| `lesson-bench-claims.test.mjs` | CI (`npm test`) | — | 31 | — |
| `lesson-debugger-surface.test.mjs` | CI (`npm test`) | — | 29 | floored (2) |
| `lesson-defect-detector.test.mjs` | CI (`npm test`) | — | 32 | floored (2) |
| `lesson-language-matrix.test.mjs` | CI (`npm test`) | — | 13 | floored (4) |
| `lesson-numeric-contract.test.mjs` | CI (`npm test`) | — | 12 | floored (3) |
| `lessons.test.mjs` | CI (`npm test`) | — | 71 | floored (15) |
| `microbit-debug.test.mjs` | CI (`npm test`) | — | 86 | — |
| `microbit-sim.test.mjs` | CI (`npm test`) | — | 22 | — |
| `no-dead-overlay-modules.test.mjs` | CI (`npm test`) | `existsSync(builtSrc) ? false : 'packages/scratch-gui not integra`<br>`existsSync(builtSrc) ? false : 'packages/scratch-gui not integra`<br>+1 more | 6 | **NO FLOOR** — readdirSync(dir) |
| `oracle-trace.test.mjs` | CI (`npm test`) | — | 7 | — |
| `pane-divider-math.test.mjs` | CI (`npm test`) | — | 31 | — |
| `pico-voltage-drc.test.mjs` | CI (`npm test`) | — | 2 | — |
| `rect-corner-radius.test.mjs` | CI (`npm test`) | — | 5 | — |
| `representation-contract.test.mjs` | CI (`npm test`) | — | 16 | — |
| `retarget.test.mjs` | CI (`npm test`) | — | 14 | — |
| `rp2040-debug.test.mjs` | CI (`npm test`) | — | 17 | — |
| `rp2040-image.test.mjs` | CI (`npm test`) | — | 10 | — |
| `sb3-creator-motion-target.test.mjs` | CI (`npm test`) | — | 1 | — |
| `schematic-projection.test.mjs` | CI (`npm test`) | — | 10 | — |
| `schematic-visual-baselines.test.mjs` | CI (`npm test`) | — | 2 | — |
| `scope-tools.test.mjs` | CI (`npm test`) | — | 8 | — |
| `seated-board-inference.test.mjs` | CI (`npm test`) | — | 10 | — |
| `stale-build-recovery.test.mjs` | CI (`npm test`) | — | 14 | — |
| `starter-journeys.test.mjs` | CI (`npm test`) | — | 9 | **NO FLOOR** — journeys |
| `stc12-pinmap.test.mjs` | CI (`npm test`) | — | 9 | **NO FLOOR** — readdirSync(resolve(dir), { recursive: true }) |
| `stc12live-write.test.mjs` | CI (`npm test`) | — | 7 | — |
| `system-load.test.mjs` | CI (`npm test`) | — | 4 | — |
| `tab-index-contract.test.mjs` | CI (`npm test`) | `skip`<br>`skip` | 5 | — |
| `trace-csv.test.mjs` | CI (`npm test`) | — | 11 | — |
| `upstream-selectors.test.mjs` | CI (`npm test`) | `skip`<br>`skip`<br>+1 more | 5 | — |
| `vendor-manifest-contract.test.mjs` | CI (`npm test`) | — | 2 | — |

61 files; 14 corpus-driven, 10 floored, 4 without a floor.
