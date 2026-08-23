# Measured thresholds: every number that bounds a verdict, and where it came from

The sibling campaign to `docs/GATE-INVENTORY.md`. That one asked *which gates can
fail*. This one asks, of the gates that can: **the number they fail at — who
measured it?**

The question comes from the CI blackout of 2026-08-23. Nine commits landed on
`main` with no verdict at all, and when the gates came back three thresholds
turned out to have been tuned while nothing was checking them:

- `gallery-e2e`'s 420 s `--test-timeout`, never once tested against the file it
  bounds, because that file skipped whenever the pins were broken. Measured on the
  first run that reached it: **242 s, 45/45**. The bound was a guess that happened
  to hold.
- eslint's implicit *"lint everything from the root"*, which had only ever run on a
  tree with no siblings in it. The first run that had siblings linted 5.3 MB of two
  other repositories.
- `circuit-corpus-invariants`' corpus pin of **1034**, correct until a vendor added
  58 circuits.

Three found by tripping over them. This is the systematic sweep.

## What counts as a threshold

A **bounding literal** is a number written into a gate or a CI config that decides
a verdict: a floor under a corpus, a ceiling over a waiver list, a timeout, a
numeric tolerance, a retry count, a size cap, a concurrency limit, a pinned
version. Not every number — `i < arr.length` bounds a loop, not a verdict, and
counting those drowns the sweep the way tables drowned the vacuity screen before it
learned to tell a corpus from a table.

`scripts/threshold-inventory.mjs` collects them with acorn (not grep — GNU grep
stops silently at a NUL byte), following no symlink out of the tree.

## Two instruments, and the difference between them

**`threshold-inventory.mjs` reports whether a measurement is RECORDED next to the
number** — a date, a `MEASURED`, an `expected ~N`, in the comment block above or in
the assertion's own failure message. That is a claim about the comment, not about
the world.

**`threshold-probe.mjs` asks the world.** It answers two separate questions:

- **Can it fire?** Move the literal past its bound — a floor raised absurdly, a
  ceiling dropped to `-1` — and require the gate to go RED. A threshold that stays
  green under that is not a threshold; it is decoration, and it usually means the
  code path it guards does not run.
- **What is the margin?** Binary-search the flip point. *The flip point is the
  measurement.* A ceiling of 5 that first goes red at 3 and is green at 4 means the
  observed value is 4 — and that number goes back into the source next to the
  threshold, so nobody has to run this again.

Both directions are needed. A number can be recorded and wrong, or unrecorded and
exactly right — and the second case is common enough that the fractions below would
mislead without it. `brickwright-lite`'s four waiver ceilings carry no recorded
measurement and are all **perfectly tight**:

| waiver list | actual | ceiling | headroom |
|---|---|---|---|
| `KNOWN_INERT` | 4 | 4 | 0 |
| `KNOWN_SHADOWED_WRITES` | 19 | 19 | 0 |
| `KNOWN_NO_BLOCKS` | 2 | 2 | 0 |
| `TIME_GATED` | 2 | 2 | 0 |

Zero headroom on all four: no waiver can be added without the CI guard firing. That
is the correct state for a ratchet, and "not recorded" says nothing against it. The
inventory's job is to raise the question, not to answer it.

## The probe caught a bug in the inventory, which is what it is for

`device-coverage.test.mjs:76` came back **CANNOT-FIRE** on the first run. The probe
was right that something was broken; it was the classifier.

```js
assert.ok(x < 80)      // x must stay BELOW 80  -> a ceiling
if (x < 80) throw …    // x must stay ABOVE 80  -> a floor, spelled as its negation
```

The inventory classified by the operator alone, so it read the second as a ceiling;
the probe then dropped it to `-1`, where the throw can never fire, and reported the
threshold as decoration. Polarity is now inverted for `if (…) throw` guards. The
counts moved `ceiling 12 → 10`, `floor 172 → 175`, and that entry reads `floor=80`.

Worth stating plainly, because it is the same lesson as wave 2's: **an instrument
that disagrees with the world is more often wrong than the world is, and the way to
tell is to have two of them.**

---

## The count, and the fraction actually investigated

```
sb3-creator        221 bounding literals in 70 files —  37 carry a recorded measurement
brickwright-lite   238 bounding literals in 69 files —   1 carries a recorded measurement
```

| kind | sb3-creator | evidenced | brickwright-lite | evidenced |
|---|---|---|---|---|
| floor | 176 | 31 | 65 | 1 |
| timeout-ms | 19 | 0 | 118 | 0 |
| ceiling | 9 | 5 | 22 | 0 |
| tolerance | 6 | 0 | 19 | 0 |
| size-cap | 4 | 0 | 6 | 0 |
| pin | 3 | 0 | 7 | 0 |
| concurrency | 2 | 0 | — | — |
| timeout-min | 2 | 1 | 1 | 0 |

**459 is more than can be individually re-measured, and pretending otherwise would
be the same sin this campaign is about.** So the denominator is stated and the work
is prioritised by what an unevidenced number costs:

| class | population | probed | outcome |
|---|---|---|---|
| timeouts in a gate | 14 | **14/14** | 13 CAN-FIRE, 1 unreachable (opt-in oracle) |
| ceilings in a gate | 8 | **8/8** | 5 CAN-FIRE, 1 CANNOT-FIRE (fixed), 2 retracted (stale rig) |
| `device-coverage` floors | 3 | **3/3** | 2 CAN-FIRE, 1 reachable only under `CI=true` |
| lite waiver ceilings | 4 | **4/4** (counted, not probed — read-only repo) | all zero-headroom |
| everything else | ~430 | 0 | listed below, unprobed, and said so |

`brickwright-lite`'s 118 timeouts are almost all Playwright/puppeteer waits in
`scripts/verify-*.mjs`, which need a built editor and a browser. They are listed
and left; probing them is a lane of its own.

## What was found

### 1. `timeout: 5000` on `python3 ast.parse` — a busy box reported as a syntax error

`debug-micropython` and `debug-trace-audit` each carried a copy of a `python3` call
whose catch-all folded **every** subprocess failure into `{ valid: false }`, which
the caller asserted on with the message `syntax error:`. On a box at load 18–21 one
run produced eight of:

```
not ok 2 - syntactically valid Python
  error: |-
    syntax error:
    spawnSync /bin/sh ETIMEDOUT
```

The emitter was fine. The machine was busy — and the same eight were absent from
the next run of the same commit, which is how a gate teaches people it is noise.

**Where 5000 came from: nowhere recorded.** MEASURED, 25 consecutive runs of the
exact command at load 19.5: **min 384 ms, median 504 ms, p90 658 ms, max 721 ms.**
The useful half of that is that 5000 was *already* ~7× the p90 and still fired
eight times. The distribution has a tail a bigger constant does not remove, so
**raising the number was never the fix**. `test/helpers/python-syntax.mjs` now
makes the three outcomes different — accepted, rejected with python's own message,
or `PythonUnavailableError` saying *"THIS IS NOT A SYNTAX ERROR — the generated
Python was never judged"* — and `test/python-syntax-contract.test.mjs` pins all
three plus a **floor under the budget**, because shrinking it back is how the flake
returns.

### 2. `gallery-roundtrip:45` — a bound that could not fire

```js
assert.ok(dc.trim() === '' || dc.trim().length < 5, 'comment-only file decompiles to near-empty');
```

The probe moved `5` to `-1` and the gate stayed green: the first disjunct always
holds. MEASURED over **all 114** comment-only gallery entries — the set of observed
lengths is `{0}`. The slack bounded nothing and only stopped the assertion noticing
four characters of stray output. Tightened to `assert.equal(dc.trim(), '')` and
proven able to fire: appending `xyz` to the decompile reddens 114 subtests.

### 3. `device-coverage`'s engine-kind floor of 80 — measured in the snapshot era

Live is **118** (`bw-board@caeac2b`). A floor of 80 sits 32% below, so the engine
could shed thirty-eight kinds — a third of its device surface — before this
noticed. Raised to **110** (~7% under measured). The developer-box branch went
`80 → 78`, ~5% under the *snapshot's* 82, because that branch has to be true in
both worlds.

### 4. Thresholds that are already exactly right, recorded so they stay that way

| where | bound | observed | headroom |
|---|---|---|---|
| `a2-calculator-behavior:90` | `++dticks > 8` | 8 | **0%** |
| `ctarget:972` | `warnings <= 5` | 4 | 20% |
| `trace-oracle:166` | `\|tMs − 300\| <= 2` | 0 | 100% |
| `trace-oracle:168` | `tMs <= 910` | 800 | 12% |
| `trace-oracle:521` | `tMs <= 510` | 500 | 2% |
| lite `KNOWN_INERT` / `KNOWN_SHADOWED_WRITES` / `KNOWN_NO_BLOCKS` / `TIME_GATED` | ratchets | 4 / 19 / 2 / 2 | **0%** all four |

`trace-oracle:166`'s 100% headroom is the one worth a sentence: the event lands on
exactly 300 ms, so the ±2 has never been needed. It is **kept**, not tightened,
because the quantity is a polled timestamp — a tolerance of 0 on a sampled clock is
a flake waiting for a slow runner, and this campaign has just finished paying for
one of those. The number now says what it is worth.

## Three instrument fixes, each forced by a wrong answer

**Polarity.** `assert.ok(x < 80)` is a ceiling; `if (x < 80) throw` is a floor
spelled as its own negation. Classifying by operator alone made the probe drop
`device-coverage`'s guard to `-1`, where the throw can never fire, and report it as
decoration. `ceiling 12 → 10`, `floor 172 → 175`.

**The rig must match the pins.** The probe called `gallery.test.mjs` and
`gallery-e2e.test.mjs` UNTESTABLE — "already red before the probe" — and both are
green on `main`. The pins had moved (`d754cfc → b5761ad`) in a merge and the rig
was still on the old ones, where `wireEndpoint is not a function`. **Two findings
retracted; they were about the checkout, not the repo.** The probe now refuses to
report on a drifted rig, and *names* what is dirty rather than collapsing it to a
boolean — a deviation confined to `node_modules` is a note, because `bw-board`
tracks a `node_modules` symlink that dangles on every Linux clone (PLAN.md §27).

**A skip is not evidence.** `ttl-module-acceptance:52`'s 30 s subprocess timeout
came back CANNOT-FIRE. The four tests that reach it skip without `BW_TTL_ORACLE=1`
plus Java, `Digital.jar` and a cloned `8bitsim`; 2 of 6 ran and neither calls
`translate()`. The probe now reports `NOT-REACHED` when nothing in a file ran, and
otherwise says how much was skipped alongside — so *"the code path does not
execute"* and *"the tests that use it are among the skipped ones"* stop being the
same sentence. Repeating wave 1's confusion inside the instrument built to find it
would have been poor form.

---

## Every bounding literal

Generated by `node scripts/threshold-inventory.mjs --markdown`, 2026-08-23, against
`sb3-creator@4abeadb` and `brickwright-lite@2e294ceaf`.

A row saying **not recorded** is a QUESTION, not a verdict — see the four lite
ratchets above, which are unrecorded and perfectly tight. Rows with a measurement
quote it from the comment block or the assertion message.

### `sb3-creator` — 221 bounding literals

| kind | count | with a recorded measurement |
|---|---|---|
| floor | 176 | 31 |
| timeout-ms | 19 | 0 |
| ceiling | 9 | 5 |
| tolerance | 6 | 0 |
| size-cap | 4 | 0 |
| pin | 3 | 0 |
| concurrency | 2 | 0 |
| timeout-min | 2 | 1 |

| where | kind | value | bounds | measurement |
|---|---|---|---|---|
| `test/6502-oled-compile.test.mjs:55` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `test/a2-calculator-behavior.test.mjs:94` | ceiling | `8` | `++dticks > 8` | // MEASURED 2026-08-23 (scripts/threshold-probe.mjs --margin): the display |
| `test/a2-sampler-behavior.test.mjs:76` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `test/a2-sampler-behavior.test.mjs:135` | concurrency | `1` | `concurrency: 1` | **not recorded** |
| `test/arduino-import.test.mjs:79` | floor | `10` | `r.pseudocode.length > 10` | **not recorded** |
| `test/assert-physics.test.mjs:117` | tolerance | `0.003` | `tolerance: parseFloat(netMvMatch[3]) / 1000` | **not recorded** |
| `test/assert-physics.test.mjs:173` | tolerance | `0` | `tolerance: rawTol === null ? 0 : (periodMatch[4] === '%' ? expected * rawTol / 100 : rawTol)` | **not recorded** |
| `test/assert-physics.test.mjs:193` | tolerance | `0.02` | `tolerance: rawTol === null ? expected * 0.02 : (pulseMatch[3] === '%' ? expected * rawTol / 100…` | **not recorded** |
| `test/assert-physics.test.mjs:208` | tolerance | `0.02` | `tolerance: rawTol === null ? expected * 0.02 : (toneMatch[3] === '%' ? expected * rawTol / 100 …` | **not recorded** |
| `test/basic-linemap.test.mjs:93` | floor | `1` | `idx >= 1` | **not recorded** |
| `test/basic-linemap.test.mjs:115` | floor | `0` | `Object.keys(r.lineMap).length > 0` | **not recorded** |
| `test/basic-sweep.test.mjs:27` | floor | `0` | `r.basic.length > 0` | **not recorded** |
| `test/basic-sweep.test.mjs:34` | floor | `0` | `r.basic.length > 0` | **not recorded** |
| `test/basic-sweep.test.mjs:50` | floor | `0` | `rb.pseudocode.length > 0` | **not recorded** |
| `test/basic-sweep.test.mjs:62` | floor | `0` | `rb.pseudocode.length > 0` | **not recorded** |
| `test/basic-sweep.test.mjs:75` | floor | `0` | `w.length > 0` | **not recorded** |
| `test/bench-invariants.test.mjs:55` | floor | `200` | `sidecars >= 200` | // MEASURED FLOOR. Without one, a parts-data directory that moved or emptied |
| `test/bench-invariants.test.mjs:92` | floor | `1000` | `benchFiles.length >= 1000` | `only ${benchFiles.length} bench files found under ${EXAMPLES} (expected ~1092) — ` + |
| `test/bench-invariants.test.mjs:95` | floor | `200` | `primary >= 200` | `only ${primary} primary circuit.json benches found (expected ~222) — the file ` + |
| `test/bench-invariants.test.mjs:98` | floor | `800` | `suffixed >= 800` | `only ${suffixed} device-suffixed benches found (expected ~870)`) |
| `test/calculator-frame.test.mjs:120` | floor | `1` | `blits > 1` | **not recorded** |
| `test/chost.test.mjs:69` | floor | `25` | `compiled >= 25` | **not recorded** |
| `test/chost.test.mjs:227` | floor | `30` | `identical >= 30` | **not recorded** |
| `test/circuit-json-roundtrip.test.mjs:182` | floor | `0` | `leds.length > 0` | **not recorded** |
| `test/circuit-json-roundtrip.test.mjs:198` | floor | `0` | `motors.length > 0` | **not recorded** |
| `test/circuit-json-roundtrip.test.mjs:213` | floor | `30` | `circuitCount >= 30` | **not recorded** |
| `test/circuit-params-are-read.test.mjs:164` | floor | `100` | `engineFiles.length >= 100` | **not recorded** |
| `test/circuit-params-are-read.test.mjs:166` | floor | `50` | `read.size >= 50` | **not recorded** |
| `test/circuit-params-are-read.test.mjs:167` | floor | `2000` | `circuitFiles >= 2000` | **not recorded** |
| `test/circuit-params-are-read.test.mjs:168` | floor | `30` | `sites.size >= 30` | **not recorded** |
| `test/codegen.test.mjs:27` | floor | `20` | `py.length > 20` | **not recorded** |
| `test/corpus-generator.test.mjs:367` | floor | `0` | `trace.events.length > 0` | **not recorded** |
| `test/corpus-generator.test.mjs:367` | floor | `0` | `trace.serial.length > 0` | **not recorded** |
| `test/corpus-generator.test.mjs:381` | floor | `100` | `code.length > 100` | **not recorded** |
| `test/ctarget.test.mjs:284` | floor | `4` | `labels.length >= 4` | **not recorded** |
| `test/ctarget.test.mjs:942` | floor | `5` | `hardware.length >= 5` | **not recorded** |
| `test/ctarget.test.mjs:972` | ceiling | `5` | `(forced.match(/warning:/g) \|\| []).length <= 5` | **not recorded** |
| `test/ctarget.test.mjs:1770` | floor | `0` | `map.length > 0` | **not recorded** |
| `test/ctarget.test.mjs:1814` | floor | `0` | `readYieldMap(cOf(SCHEDULED, {debug: true})).length > 0` | **not recorded** |
| `test/ctarget.test.mjs:1826` | floor | `0` | `readYieldMap(debug).length > 0` | **not recorded** |
| `test/ctarget.test.mjs:1895` | floor | `0` | `yields.length > 0` | **not recorded** |
| `test/ctarget.test.mjs:1900` | floor | `0` | `y.block.length > 0` | **not recorded** |
| `test/ctarget.test.mjs:3190` | floor | `0` | `first >= 0` | **not recorded** |
| `test/ctarget.test.mjs:3202` | floor | `0` | `r.stats.mapped > 0` | **not recorded** |
| `test/cube-directions.test.mjs:31` | floor | `6` | `corpusFloor("cube directions")` | // MEASURED 2026-08-23: 6 directions. Several tests here are generated from |
| `test/curriculum.test.mjs:18` | floor | `45` | `corpusFloor("curriculum stations")` | // MEASURED 2026-08-23: 5 trails, 15 chapters, 53 stations; 274 index entries. |
| `test/curriculum.test.mjs:21` | floor | `250` | `corpusFloor("example ids the curriculum is checked against")` | **not recorded** |
| `test/debug-micropython.test.mjs:36` | floor | `8` | `corpusFloor("micro:bit examples discovered from examples/index.json")` | // MEASURED 2026-08-23: 9 of 274 index.json entries. The corpus is DISCOVERED by |
| `test/debug-trace-audit.test.mjs:36` | floor | `14` | `corpusFloor("MicroPython examples discovered from examples/index.json")` | // MEASURED 2026-08-23: 16 of 274 index.json entries. Same shape as |
| `test/decompile.test.mjs:98` | floor | `0` | `c.warnings.length > 0` | **not recorded** |
| `test/device-coverage.test.mjs:82` | floor | `110` | `engineKinds.length < 110` | // 80 was measured in the snapshot era and went stale: MEASURED 2026-08-23 |
| `test/device-coverage.test.mjs:284` | floor | `78` | `engineKinds.length >= 78` | // MEASURED 2026-08-23 against bw-board@caeac2b: 118 kinds live, 82 in the |
| `test/device-coverage.test.mjs:293` | floor | `110` | `engineKinds.length >= 110` | `the live engine reported only ${engineKinds.length} kinds (expected ~118)`) |
| `test/example-corpus-contract.test.mjs:36` | floor | `259` | `index.length >= 259` | **not recorded** |
| `test/example-corpus-contract.test.mjs:37` | floor | `1034` | `circuitFiles.length >= 1034` | **not recorded** |
| `test/example-corpus-contract.test.mjs:38` | floor | `819` | `generatedFiles.length >= 819` | **not recorded** |
| `test/example-kind-matches-content.test.mjs:75` | floor | `259` | `index.length >= 259` | **not recorded** |
| `test/example-kind-matches-content.test.mjs:77` | floor | `100` | `withBlocks >= 100` | **not recorded** |
| `test/example-kind-matches-content.test.mjs:79` | floor | `100` | `without >= 100` | **not recorded** |
| `test/exec.test.mjs:22` | timeout-ms | `800` | `timeout: 800` | **not recorded** |
| `test/exec.test.mjs:34` | floor | `30` | `corpusFloor("examples to execute")` | // one. MEASURED 2026-08-23: src/utils/examples.js exports 35 examples, 30 of them non-ha… |
| `test/extension-coverage.test.mjs:68` | floor | `100` | `COMPILED >= 100` | **not recorded** |
| `test/extension-coverage.test.mjs:71` | floor | `10` | `AUTHORED.stc12.size >= 10` | **not recorded** |
| `test/extensions.test.mjs:66` | timeout-ms | `1000` | `timeout: 1000` | **not recorded** |
| `test/extensions.test.mjs:189` | timeout-ms | `1000` | `timeout: 1000` | **not recorded** |
| `test/extensions.test.mjs:276` | timeout-ms | `1000` | `timeout: 1000` | **not recorded** |
| `test/extensions.test.mjs:338` | timeout-ms | `1000` | `timeout: 1000` | **not recorded** |
| `test/extensions.test.mjs:410` | timeout-ms | `1000` | `timeout: 1000` | **not recorded** |
| `test/extensions.test.mjs:485` | floor | `15` | `Object.keys(reg).length >= 15` | `only ${Object.keys(reg).length} runtime extensions registered (expected ~19)`) |
| `test/extensions.test.mjs:487` | floor | `700` | `ops >= 700` | `only ${ops} runtime-extension ops walked (expected ~775) — the declarative ` + |
| `test/features.test.mjs:207` | floor | `0` | `jump.sampleCount > 0` | **not recorded** |
| `test/features.test.mjs:208` | floor | `0` | `meow.sampleCount > 0` | **not recorded** |
| `test/features.test.mjs:241` | floor | `5` | `base.n > 5` | **not recorded** |
| `test/features.test.mjs:331` | floor | `2` | `c.project.monitors.length >= 2` | **not recorded** |
| `test/flat-variants-manifest.test.mjs:65` | floor | `900` | `MANIFEST.entries.length > 900` | **not recorded** |
| `test/flat-variants-manifest.test.mjs:125` | floor | `0` | `mutated.wires.length > 0` | **not recorded** |
| `test/flat-variants.test.mjs:92` | floor | `900` | `pairs.length > 900` | **not recorded** |
| `test/flat-variants.test.mjs:100` | floor | `900` | `pairs.length > 900` | // would otherwise loop over an empty array and PASS — observed 2026-08-23, |
| `test/gallery-e2e.test.mjs:378` | floor | `0` | `board.parts.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:409` | floor | `0` | `board.parts.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:417` | floor | `0` | `state.omega >= 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:430` | tolerance | `0.1` | `bSink > 0.1` | **not recorded** |
| `test/gallery-e2e.test.mjs:431` | tolerance | `0.02` | `bSource < 0.02` | **not recorded** |
| `test/gallery-e2e.test.mjs:437` | floor | `0` | `board.parts.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:441` | floor | `8` | `leds.length >= 8` | **not recorded** |
| `test/gallery-e2e.test.mjs:446` | floor | `0` | `board.parts.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:552` | floor | `0` | `board.parts.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:554` | floor | `0` | `buzzers.length > 0` | **not recorded** |
| `test/gallery-e2e.test.mjs:567` | floor | `400` | `tone.hz > 400` | `expected ~440 Hz, got ${tone.hz.toFixed(1)} Hz`) |
| `test/gallery-e2e.test.mjs:567` | ceiling | `480` | `tone.hz < 480` | `expected ~440 Hz, got ${tone.hz.toFixed(1)} Hz`) |
| `test/gallery-e2e.test.mjs:592` | floor | `0` | `r.reasons.length > 0` | **not recorded** |
| `test/gallery-roundtrip.test.mjs:42` | floor | `0` | `project.targets.length > 0` | **not recorded** |
| `test/gallery-roundtrip.test.mjs:71` | floor | `40` | `exampleDirs.length >= 40` | **not recorded** |
| `test/gallery.test.mjs:93` | floor | `0` | `code.length > 0` | **not recorded** |
| `test/gallery.test.mjs:135` | floor | `0` | `js.length > 0` | **not recorded** |
| `test/gallery.test.mjs:171` | floor | `0` | `circuit.vcc > 0` | **not recorded** |
| `test/gallery.test.mjs:203` | floor | `100` | `content.length > 100` | **not recorded** |
| `test/gallery.test.mjs:225` | floor | `1` | `entry.difficulty >= 1` | **not recorded** |
| `test/gallery.test.mjs:225` | ceiling | `5` | `entry.difficulty <= 5` | **not recorded** |
| `test/gate-integrity.test.mjs:98` | floor | `40` | `scanned >= 40` | **not recorded** |
| `test/gate-integrity.test.mjs:100` | floor | `12` | `crossRepo >= 12` | **not recorded** |
| `test/gate-integrity.test.mjs:264` | floor | `40` | `scanned >= 40` | // stopped matching". MEASURED 2026-08-23: 90 files, 24 sibling paths. |
| `test/gate-integrity.test.mjs:267` | floor | `15` | `siblingPathsSeen >= 15` | '(expected ~24). Every pattern here may have stopped matching, in which ' + |
| `test/gate-integrity.test.mjs:304` | floor | `80` | `inv.rows.length >= 80` | // default. MEASURED 2026-08-23: 88 files, 47 of them corpus-driven. |
| `test/gate-integrity.test.mjs:311` | floor | `40` | `corpusDriven.length >= 40` | `only ${corpusDriven.length} corpus-driven files recognised (expected ~47) — ` + |
| `test/gate-integrity.test.mjs:427` | floor | `0` | `circ.board.parts.length > 0` | **not recorded** |
| `test/gate-integrity.test.mjs:427` | floor | `0` | `circ.board.nets.length > 0` | **not recorded** |
| `test/generated-bench-layout.test.mjs:56` | floor | `0` | `flat.length > 0` | **not recorded** |
| `test/generated-bench-layout.test.mjs:60` | floor | `900` | `kept.length > 900` | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:71` | floor | `0` | `circ.board.parts.length > 0` | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:71` | floor | `0` | `circ.board.nets.length > 0` | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:91` | timeout-ms | `8000` | `timeout: 8000` | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:101` | floor | `20` | `sdaEdges > 20` | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:106` | floor | `20` | `lit >= 20` | **not recorded** |
| `test/kcl-residual.test.mjs:101` | floor | `1500` | `files.length > 1500` | **not recorded** |
| `test/kcl-residual.test.mjs:107` | floor | `1500` | `files.length > 1500` | **not recorded** |
| `test/kcl-residual.test.mjs:188` | floor | `1900` | `circuitsSolved > 1900` | // Floors are MEASURED, not invented. On 2026-08-23 this corpus gives |
| `test/kcl-residual.test.mjs:190` | floor | `30` | `netsChecked >= 30` | 'only ' + netsChecked + ' nets were checkable (expected ~37) - either the ' + |
| `test/live.test.mjs:44` | floor | `0` | `size > 0` | **not recorded** |
| `test/live.test.mjs:46` | floor | `1` | `project.targets.length >= 1` | **not recorded** |
| `test/live.test.mjs:89` | floor | `1` | `Object.keys(stage.broadcasts).length >= 1` | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:27` | floor | `1` | `pbPins.length >= 1` | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:28` | floor | `1` | `mkPins.length >= 1` | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:74` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:85` | floor | `17` | `pools.matrix.rows.length * pools.matrix.cols.length >= 17` | **not recorded** |
| `test/micropython-pico-roundtrip.test.mjs:47` | floor | `15` | `authored.length >= 15` | // MEASURED 2026-08-23: 70-calculator declares 19 PINs. The per-pin assertions |
| `test/multimeter-chain.test.mjs:92` | floor | `200` | `sidecars >= 200` | // MEASURED 2026-08-23: 239 sidecars in bw-circuit-ui@d754cfc. Same floor as |
| `test/multimeter-chain.test.mjs:99` | floor | `0` | `circ.board.parts.length > 0` | **not recorded** |
| `test/multimeter-chain.test.mjs:99` | floor | `0` | `circ.board.nets.length > 0` | **not recorded** |
| `test/multimeter-chain.test.mjs:150` | floor | `200` | `sidecars >= 200` | // MEASURED 2026-08-23: 239 sidecars in bw-circuit-ui@d754cfc. Same floor as |
| `test/multimeter-chain.test.mjs:157` | floor | `0` | `circ.board.parts.length > 0` | **not recorded** |
| `test/multimeter-chain.test.mjs:157` | floor | `0` | `circ.board.nets.length > 0` | **not recorded** |
| `test/oled-flush.test.mjs:78` | floor | `1` | `count(py, '_oled.show()') > 1` | **not recorded** |
| `test/pico-oled-chain.test.mjs:106` | floor | `0` | `circ.board.parts.length > 0` | **not recorded** |
| `test/pico-oled-chain.test.mjs:106` | floor | `0` | `circ.board.nets.length > 0` | **not recorded** |
| `test/pico-oled-chain.test.mjs:127` | floor | `1000` | `sclEdges > 1000` | **not recorded** |
| `test/pico-oled-chain.test.mjs:128` | floor | `100` | `sdaEdges > 100` | **not recorded** |
| `test/pico-oled-chain.test.mjs:129` | floor | `3` | `board.readAnalog('GP0') > 3` | **not recorded** |
| `test/pico-oled-chain.test.mjs:134` | floor | `20` | `lit0 >= 20` | **not recorded** |
| `test/program-reads-what-it-writes.test.mjs:108` | floor | `250` | `dirs.length >= 250` | **not recorded** |
| `test/program-reads-what-it-writes.test.mjs:112` | floor | `80` | `withVars >= 80` | **not recorded** |
| `test/python-syntax-contract.test.mjs:74` | floor | `20000` | `PY_BUDGET_DEFAULT_MS >= 20_000` | // MEASURED 2026-08-23, 25 consecutive runs of the exact command on a box at |
| `test/rail-short.test.mjs:97` | floor | `1500` | `files.length > 1500` | **not recorded** |
| `test/rail-short.test.mjs:103` | floor | `1500` | `files.length > 1500` | **not recorded** |
| `test/retarget-amplification.test.mjs:32` | floor | `35` | `corpusFloor("retargetable programs in examples/index.json")` | // MEASURED 2026-08-23: 40 of 274 index.json entries. Both halves of this filter |
| `test/retarget-amplification.test.mjs:172` | floor | `0` | `trace.events.length > 0` | **not recorded** |
| `test/retarget-amplification.test.mjs:172` | floor | `0` | `trace.pwm.length > 0` | **not recorded** |
| `test/retarget-amplification.test.mjs:173` | floor | `0` | `trace.devices.length > 0` | **not recorded** |
| `test/retarget-gallery.test.mjs:58` | floor | `0` | `i >= 0` | **not recorded** |
| `test/retarget-gallery.test.mjs:86` | floor | `100` | `out.length > 100` | **not recorded** |
| `test/retarget.test.mjs:151` | floor | `200` | `out.length > 200` | **not recorded** |
| `test/roundtrip.test.mjs:29` | floor | `25` | `corpusFloor("examples to round-trip (non-hardware)")` | // MEASURED 2026-08-23: src/utils/examples.js exports 35 examples, 30 of them non-hardwar… |
| `test/settrace-codegen.test.mjs:62` | floor | `6` | `entries.length >= 6` | **not recorded** |
| `test/settrace-codegen.test.mjs:94` | floor | `6` | `d.positions.length >= 6` | **not recorded** |
| `test/settrace-codegen.test.mjs:138` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `test/settrace-codegen.test.mjs:146` | floor | `3` | `seen.length >= 3` | **not recorded** |
| `test/settrace-codegen.test.mjs:168` | floor | `2` | `stack.length >= 2` | **not recorded** |
| `test/shape-coverage.test.mjs:92` | floor | `0` | `kinds > 0` | **not recorded** |
| `test/shape-coverage.test.mjs:93` | floor | `0` | `filled > 0` | **not recorded** |
| `test/shape-coverage.test.mjs:100` | floor | `0` | `description.length > 0` | **not recorded** |
| `test/stc12-conformance.test.mjs:67` | floor | `25` | `STC12.opcodes.size >= 25` | **not recorded** |
| `test/stc12-conformance.test.mjs:70` | floor | `5` | `LEDCUBE.opcodes.size >= 5` | **not recorded** |
| `test/stc12-conformance.test.mjs:73` | floor | `0` | `STC12.args[op].size > 0` | **not recorded** |
| `test/stc12-conformance.test.mjs:188` | floor | `3` | `names.length >= 3` | **not recorded** |
| `test/stc12-conformance.test.mjs:226` | floor | `4` | `roots.length >= 4` | **not recorded** |
| `test/stc12-conformance.test.mjs:242` | floor | `5` | `Object.keys(MANIFEST.snapshots).length >= 5` | **not recorded** |
| `test/trace-oracle.test.mjs:172` | ceiling | `2` | `Math.abs(t.events[0].tMs - 300) <= 2` | // MEASURED 2026-08-23 (threshold-probe --margin): the event lands on EXACTLY |
| `test/trace-oracle.test.mjs:178` | floor | `800` | `t.events[1].tMs >= 800` | // MEASURED 2026-08-23: observed 800 exactly, so 910 carries 12% headroom — |
| `test/trace-oracle.test.mjs:178` | ceiling | `910` | `t.events[1].tMs <= 910` | // MEASURED 2026-08-23: observed 800 exactly, so 910 carries 12% headroom — |
| `test/trace-oracle.test.mjs:303` | floor | `0` | `t.events.length > 0` | **not recorded** |
| `test/trace-oracle.test.mjs:533` | floor | `500` | `t.serial[0].tMs >= 500` | // MEASURED 2026-08-23: observed 500 exactly; 510 is 2% headroom. Tight, and |
| `test/trace-oracle.test.mjs:533` | ceiling | `510` | `t.serial[0].tMs <= 510` | // MEASURED 2026-08-23: observed 500 exactly; 510 is 2% headroom. Tight, and |
| `test/transparency.test.mjs:63` | floor | `25` | `corpusFloor("examples under the permutation matrix")` | // on purpose and nobody would notice losing. MEASURED 2026-08-23: src/utils/examples.js … |
| `test/ttl-module-acceptance.test.mjs:52` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:65` | floor | `5` | `circuit.parts.length >= 5` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:66` | floor | `10` | `circuit.wires.length >= 10` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:72` | floor | `4` | `leds.length >= 4` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:79` | floor | `5` | `clockWires.length >= 5` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:91` | floor | `4` | `aSide.length >= 4` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:126` | floor | `4` | `muxYWires.length >= 4` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:130` | floor | `4` | `leds.length >= 4` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:133` | floor | `20` | `circuit.wires.length >= 20` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:147` | floor | `10` | `circuit.parts.length >= 10` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:148` | floor | `20` | `circuit.wires.length >= 20` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:162` | floor | `10` | `circuit.parts.length >= 10` | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:163` | floor | `20` | `circuit.wires.length >= 20` | **not recorded** |
| `test/vm-and-c-agree-on-arithmetic.test.mjs:109` | floor | `250` | `dirs.length >= 250` | **not recorded** |
| `test/vm-and-c-agree-on-arithmetic.test.mjs:110` | floor | `100` | `targets >= 100` | **not recorded** |
| `test/vm.test.mjs:112` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `test/vm.test.mjs:170` | concurrency | `1` | `concurrency: 1` | **not recorded** |
| `test/vm.test.mjs:182` | floor | `1` | `vm.runtime.targets.length >= 1` | **not recorded** |
| `test/vm.test.mjs:488` | floor | `0` | `tgt >= 0` | **not recorded** |
| `test/vm.test.mjs:498` | floor | `3` | `revealed > 3` | **not recorded** |
| `test/vm.test.mjs:591` | floor | `18` | `lowest >= 18` | **not recorded** |
| `test/vm.test.mjs:598` | floor | `4` | `filled >= 4` | **not recorded** |
| `test/wire-endpoint-adoption.test.mjs:100` | floor | `100` | `files.length > 100` | **not recorded** |
| `test/wire-endpoint-adoption.test.mjs:104` | floor | `0` | `hits.size > 0` | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:24` | floor | `1` | `inPins.length >= 1` | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:25` | floor | `1` | `mkPins.length >= 1` | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:67` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:78` | floor | `17` | `pools.matrix.rows.length * pools.matrix.cols.length >= 17` | **not recorded** |
| `test/helpers/corpus-floor.mjs:44` | floor | `1` | `floor < 1` | **not recorded** |
| `test/helpers/downstream.mjs:62` | ceiling | `0` | `missing.length > 0` | **not recorded** |
| `scripts/gen-runtime-registry.mjs:103` | timeout-ms | `8000` | `timeout: 8000` | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:126` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:261` | floor | `0` | `at < 0` | **not recorded** |
| `scripts/oracle-bbcsdl.mjs:73` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `scripts/settrace-smoke.mjs:131` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/settrace-smoke.mjs:141` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/starve-gate.mjs:156` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | **not recorded** |
| `scripts/threshold-probe.mjs:130` | floor | `0` | `idx < 0` | **not recorded** |
| `scripts/threshold-probe.mjs:170` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | **not recorded** |
| `scripts/threshold-probe.mjs:200` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | **not recorded** |
| `scripts/vendor-flat-partitions.mjs:134` | floor | `900` | `pairs.length < 900` | **not recorded** |
| `.github/workflows/ci.yml:104` | timeout-min | `30` | `job/step timeout` | # a four-minute file on a developer box (measured 242 s, 45/45) and this |
| `.github/workflows/ci.yml:122` | timeout-min | `25` | `job/step timeout` | **not recorded** |
| `.github/workflows/ci.yml:70` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/ci.yml:147` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/ci.yml:177` | pin | `22` | `node-version` | **not recorded** |
| `package.json:14` | timeout-ms | `900000` | `--test-timeout` | **not recorded** |
| `package.json:22` | ceiling | `0` | `eslint --max-warnings` | **not recorded** |

### `brickwright-lite` — 238 bounding literals

| kind | count | with a recorded measurement |
|---|---|---|
| timeout-ms | 118 | 0 |
| floor | 65 | 1 |
| ceiling | 22 | 0 |
| tolerance | 19 | 0 |
| pin | 7 | 0 |
| size-cap | 6 | 0 |
| timeout-min | 1 | 0 |

| where | kind | value | bounds | measurement |
|---|---|---|---|---|
| `test/about-data.test.mjs:23` | floor | `8` | `titles.length >= 8` | **not recorded** |
| `test/app-store-metadata.test.mjs:29` | floor | `500` | `copy.length > 500` | **not recorded** |
| `test/app-store-metadata.test.mjs:30` | ceiling | `4000` | `copy.length <= 4000` | **not recorded** |
| `test/circuit-hit-test.test.mjs:43` | ceiling | `300` | `b.minX < 300` | **not recorded** |
| `test/circuit-hit-test.test.mjs:43` | floor | `300` | `b.maxX > 300` | **not recorded** |
| `test/circuit-hit-test.test.mjs:44` | ceiling | `240` | `b.minY < 240` | **not recorded** |
| `test/circuit-hit-test.test.mjs:44` | floor | `240` | `b.maxY > 240` | **not recorded** |
| `test/circuit-hit-test.test.mjs:47` | ceiling | `300` | `rotated.minX < 300` | **not recorded** |
| `test/circuit-hit-test.test.mjs:47` | floor | `300` | `rotated.maxX > 300` | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | ceiling | `300` | `b.minX < 300` | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | floor | `300` | `b.maxX > 300` | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | ceiling | `200` | `b.minY < 200` | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | floor | `200` | `b.maxY > 200` | **not recorded** |
| `test/circuit-tab-index.test.mjs:14` | floor | `0` | `circuitPos > 0` | **not recorded** |
| `test/condition.test.mjs:120` | floor | `0` | `why.length > 0` | **not recorded** |
| `test/controller-board-face.test.mjs:29` | tolerance | `39.9` | `breadboardTop - unoBottom >= 39.9` | **not recorded** |
| `test/controller-integration.test.mjs:108` | floor | `0` | `last.value > 0` | **not recorded** |
| `test/controller-panel.test.mjs:670` | tolerance | `0.01` | `Math.abs(partCalls[0].value - 128 / 255) < 0.01` | **not recorded** |
| `test/controller-panel.test.mjs:976` | tolerance | `0.01` | `Math.abs(pinCalls[0].value - 0.75) < 0.01` | **not recorded** |
| `test/corpus-differential.test.mjs:34` | timeout-ms | `180000` | `timeout: 180_000` | **not recorded** |
| `test/declared-pins-wired.test.mjs:229` | ceiling | `1` | `unresolved.length <= 1` | **not recorded** |
| `test/declared-pins-wired.test.mjs:264` | tolerance | `0.25` | `withPins.length / ROWS.length >= 0.25` | **not recorded** |
| `test/declared-pins-wired.test.mjs:267` | tolerance | `0.5` | `withCircuit.length / ROWS.length >= 0.5` | **not recorded** |
| `test/declared-pins-wired.test.mjs:435` | floor | `0` | `KNOWN_UNWIRED.size > 0` | **not recorded** |
| `test/declared-pins-wired.test.mjs:435` | floor | `0` | `KNOWN_UNREAD.size > 0` | **not recorded** |
| `test/example-execution.test.mjs:309` | floor | `0` | `written.size > 0` | **not recorded** |
| `test/example-execution.test.mjs:310` | floor | `0` | `read.size > 0` | **not recorded** |
| `test/example-execution.test.mjs:387` | floor | `0` | `goodTrace.events.length > 0` | **not recorded** |
| `test/example-vm-execution.test.mjs:271` | floor | `20` | `ids.size >= 20` | **not recorded** |
| `test/example-vm-execution.test.mjs:291` | floor | `20` | `probe.opcodes.size >= 20` | **not recorded** |
| `test/example-vm-execution.test.mjs:333` | floor | `50` | `board.size > 50` | **not recorded** |
| `test/example-vm-execution.test.mjs:335` | floor | `0` | `guards.size > 0` | **not recorded** |
| `test/example-vm-execution.test.mjs:378` | floor | `10` | `addressable.size >= 10` | **not recorded** |
| `test/example-vm-execution.test.mjs:420` | floor | `259` | `entries.length >= 259` | **not recorded** |
| `test/example-vm-execution.test.mjs:421` | floor | `257` | `withProgram.length >= 257` | **not recorded** |
| `test/example-vm-execution.test.mjs:506` | floor | `0` | `run.threadsStarted > 0` | **not recorded** |
| `test/example-vm-execution.test.mjs:535` | floor | `0` | `authored.length > 0` | **not recorded** |
| `test/example-vm-execution.test.mjs:649` | floor | `117` | `report.executed.length >= 117` | `defect; expected 117+ (the measurement of 2026-08-23). Either the corpus shrank or ` + |
| `test/faceplate-thermostat.test.mjs:67` | floor | `35` | `io.get('temp') >= 35` | **not recorded** |
| `test/faceplate-thermostat.test.mjs:79` | ceiling | `35` | `panel.getValue('temp') < 35` | **not recorded** |
| `test/l10n-parity.test.mjs:52` | floor | `0` | `keys.en.size > 0` | **not recorded** |
| `test/l10n-parity.test.mjs:53` | floor | `0` | `keys.de.size > 0` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:139` | floor | `100` | `Math.abs(board.resistance(netId(board, 'vcc1', 'vcc'), netId(board, 'gnd1', 'gnd')) - 235) > 100` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:153` | ceiling | `1000` | `board.resistance(netId(board, 'vcc1', 'vcc'), netId(board, 'gnd1', 'gnd')) < 1000` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:155` | floor | `100000000` | `board.resistance(netId(board, 'btn1', 'a'), netId(board, 'btn1', 'b')) > 1e8` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:157` | floor | `100000000` | `board.resistance(netId(board, 'mcu1', 'p0.0'), netId(board, 'mcu1', 'p0.1')) > 1e8` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:195` | floor | `2` | `Math.max(...gains) - Math.min(...gains) > 2` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:268` | ceiling | `1` | `(oMax - oMin) < 1.0` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:268` | tolerance | `0.5` | `(oMax - oMin) > 0.5` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:294` | tolerance | `4.7` | `charged > 4.7` | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:328` | floor | `1000000` | `board.resistance(gnd, hot) > 1e6` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:66` | floor | `100` | `registeredKinds().length > 100` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:113` | tolerance | `0.2` | `onA > 0.2` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:113` | tolerance | `0.001` | `offA < 0.001` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:115` | tolerance | `0.001` | `offB < 0.001` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:115` | tolerance | `0.001` | `offB2 < 0.001` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:117` | tolerance | `0.2` | `onC > 0.2` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:117` | tolerance | `0.2` | `onC2 > 0.2` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:129` | tolerance | `0.4` | `b[0] - b[2] > 0.4` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:143` | tolerance | `0.2` | `errorPct > 0.2` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:143` | ceiling | `5` | `errorPct < 5` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:161` | floor | `3` | `Math.abs(supply - (p1 + p2)) > 3` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:186` | tolerance | `4.8` | `volts(board, 'cap', 'a') > 4.8` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:191` | tolerance | `2.5` | `first > 2.5` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:206` | tolerance | `0.001` | `Math.abs(before - after) < 0.001` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:218` | floor | `3` | `edgeBefore - edgeAfter > 3` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:277` | floor | `30` | `Math.abs(atCollector - inBranch) > 30` | **not recorded** |
| `test/lesson-bench-claims.test.mjs:335` | tolerance | `0.3` | `board.ledBrightness('led1') > 0.3` | **not recorded** |
| `test/lesson-debugger-surface.test.mjs:124` | floor | `0` | `readFileSync(path.join(EX, rel), 'utf8').length > 0` | **not recorded** |
| `test/lesson-defect-detector.test.mjs:73` | floor | `1` | `blocking.length >= 1` | **not recorded** |
| `test/lesson-defect-detector.test.mjs:247` | floor | `180` | `report.checkpoints >= 180` | **not recorded** |
| `test/lesson-language-matrix.test.mjs:77` | floor | `3` | `source.split('\n').length > 3` | **not recorded** |
| `test/lesson-language-matrix.test.mjs:83` | floor | `0` | `blocks > 0` | **not recorded** |
| `test/lesson-language-matrix.test.mjs:92` | floor | `40` | `out.length > 40` | **not recorded** |
| `test/lesson-language-matrix.test.mjs:97` | floor | `60` | `variants >= 60` | **not recorded** |
| `test/lesson-numeric-contract.test.mjs:61` | floor | `40` | `examined >= 40` | **not recorded** |
| `test/lesson-numeric-contract.test.mjs:62` | floor | `10` | `quoting >= 10` | **not recorded** |
| `test/lesson-numeric-contract.test.mjs:70` | ceiling | `4` | `(skipped['measurement-truncated'] \|\| 0) <= 4` | **not recorded** |
| `test/lessons.test.mjs:42` | floor | `8` | `catalog.lessons.length >= 8` | **not recorded** |
| `test/lessons.test.mjs:45` | floor | `0` | `lesson.version > 0` | **not recorded** |
| `test/lessons.test.mjs:130` | floor | `2` | `lesson.checkpoints.length >= 2` | **not recorded** |
| `test/lessons.test.mjs:136` | floor | `2` | `diodeLesson.version >= 2` | **not recorded** |
| `test/lessons.test.mjs:147` | floor | `2` | `capacitorLesson.version >= 2` | **not recorded** |
| `test/no-dead-overlay-modules.test.mjs:225` | floor | `20` | `reason.length > 20` | **not recorded** |
| `test/no-dead-overlay-modules.test.mjs:229` | floor | `20` | `reason.length > 20` | **not recorded** |
| `test/pane-divider-math.test.mjs:115` | floor | `0` | `half > 0` | **not recorded** |
| `test/pane-divider-math.test.mjs:115` | ceiling | `1` | `half < 1` | **not recorded** |
| `test/pane-divider-math.test.mjs:125` | floor | `0` | `got > 0` | **not recorded** |
| `test/pane-divider-math.test.mjs:125` | ceiling | `1` | `got < 1` | **not recorded** |
| `test/rp2040-debug.test.mjs:45` | floor | `1` | `handle >= 1` | **not recorded** |
| `test/sb3-creator-motion-target.test.mjs:13` | floor | `0` | `allBlocks.length > 0` | **not recorded** |
| `test/schematic-projection.test.mjs:68` | ceiling | `1200` | `projected.height < 1200` | **not recorded** |
| `test/schematic-projection.test.mjs:69` | floor | `500` | `projected.width > 500` | **not recorded** |
| `test/stale-build-recovery.test.mjs:31` | floor | `0` | `start > 0` | **not recorded** |
| `test/stale-build-recovery.test.mjs:35` | floor | `0` | `open > 0` | **not recorded** |
| `test/stale-build-recovery.test.mjs:132` | floor | `0` | `state.cachesDeleted > 0` | **not recorded** |
| `test/tab-index-contract.test.mjs:84` | floor | `4` | `panelCount >= 4` | **not recorded** |
| `test/upstream-selectors.test.mjs:82` | floor | `30` | `r.why.length > 30` | **not recorded** |
| `test/upstream-selectors.test.mjs:100` | floor | `0` | `used.length > 0` | **not recorded** |
| `scripts/_tmp-eyes.mjs:10` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-eyes.mjs:11` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:11` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:12` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:18` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:12` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:13` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:16` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:19` | timeout-ms | `6000` | `timeout: 6000` | **not recorded** |
| `scripts/_tmp-paint-test.mjs:7` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-paint-test.mjs:8` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:12` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:13` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:16` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:20` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:22` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:16` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:17` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:20` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:23` | timeout-ms | `8000` | `timeout: 8000` | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:31` | timeout-ms | `8000` | `timeout: 8000` | **not recorded** |
| `scripts/_tmp-rightpane.mjs:10` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-rightpane.mjs:11` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-rightpane.mjs:17` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:9` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:10` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:13` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:43` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:44` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:48` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:51` | timeout-ms | `6000` | `timeout: 6000` | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:72` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:21` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:22` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:25` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:30` | timeout-ms | `6000` | `timeout: 6000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:34` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:39` | timeout-ms | `8000` | `timeout: 8000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:52` | timeout-ms | `6000` | `timeout: 6000` | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:59` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/gen-rust-notices.mjs:17` | size-cap | `67108864` | `maxBuffer: 1024 * 1024 * 64` | **not recorded** |
| `scripts/oracle-simavr.mjs:42` | size-cap | `4194304` | `maxBuffer: 4 * 1024 * 1024` | **not recorded** |
| `scripts/probe-layout.mjs:82` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/probe-microbit-resume.mjs:85` | timeout-ms | `20000` | `timeout: 20000` | **not recorded** |
| `scripts/proof-production.mjs:79` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/sync-emu8051-wasm.mjs:51` | ceiling | `4` | `attempt >= 4` | **not recorded** |
| `scripts/verify-about-dialog.mjs:49` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-basic-run.mjs:25` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-chrome-sweep.mjs:31` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:20` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:21` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:29` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:61` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:94` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:102` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:121` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:134` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:155` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:44` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:45` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:83` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:185` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:192` | timeout-ms | `3000` | `timeout: 3000` | **not recorded** |
| `scripts/verify-circuit-ux.mjs:240` | timeout-ms | `2000` | `timeout: 2000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:25` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:29` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:98` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:126` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:221` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-controller-panel.mjs:232` | timeout-ms | `20000` | `timeout: 20000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:126` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:127` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:186` | timeout-ms | `90000` | `timeout: 90000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:187` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:192` | timeout-ms | `4000` | `timeout: 4000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:200` | timeout-ms | `5000` | `timeout: 5000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:203` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-debug-dock.mjs:205` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-debugger-solo.mjs:49` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-debugger-solo.mjs:50` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-editor.mjs:35` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-faceplate-blinkenrocket.mjs:87` | ceiling | `32` | `scr.config.rows * scr.config.cols <= 32` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:50` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:58` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:94` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:105` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:119` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:126` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:133` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:198` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:203` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:214` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:30` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:31` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:35` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:69` | floor | `0` | `after.scrollTop <= 0` | **not recorded** |
| `scripts/verify-interaction.mjs:55` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-interaction.mjs:56` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-interaction.mjs:61` | timeout-ms | `2000` | `timeout: 2000` | **not recorded** |
| `scripts/verify-interaction.mjs:62` | timeout-ms | `2000` | `timeout: 2000` | **not recorded** |
| `scripts/verify-interaction.mjs:213` | ceiling | `20` | `zoomShift <= 20` | **not recorded** |
| `scripts/verify-intro.mjs:30` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:58` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:69` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:100` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:217` | timeout-ms | `20000` | `timeout: 20000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:241` | timeout-ms | `25000` | `timeout: 25000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:265` | timeout-ms | `20000` | `timeout: 20000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:273` | timeout-ms | `25000` | `timeout: 25000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:305` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:310` | timeout-ms | `15000` | `timeout: 15000` | **not recorded** |
| `scripts/verify-microbit.mjs:32` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-schematic.mjs:48` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-schematic.mjs:49` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-schematic.mjs:56` | timeout-ms | `2000` | `timeout: 2000` | **not recorded** |
| `scripts/verify-schematic.mjs:60` | timeout-ms | `2000` | `timeout: 2000` | **not recorded** |
| `scripts/verify-starter-journeys.mjs:17` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `scripts/verify-starter-journeys.mjs:49` | timeout-ms | `45000` | `timeout: 45000` | **not recorded** |
| `scripts/verify-starter-journeys.mjs:60` | timeout-ms | `30000` | `timeout: 30000` | **not recorded** |
| `scripts/verify-starter-journeys.mjs:64` | timeout-ms | `45000` | `timeout: 45000` | **not recorded** |
| `scripts/verify-starter-journeys.mjs:66` | timeout-ms | `10000` | `timeout: 10000` | **not recorded** |
| `scripts/verify-view-buttons.mjs:33` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `scripts/verify-view-buttons.mjs:41` | timeout-ms | `60000` | `timeout: 60000` | **not recorded** |
| `.github/workflows/build.yml:17` | timeout-min | `30` | `job/step timeout` | **not recorded** |
| `.github/workflows/build.yml:200` | size-cap | `2560` | `node heap cap` | **not recorded** |
| `.github/workflows/build.yml:168` | ceiling | `4` | `ceiling KNOWN_INERT` | **not recorded** |
| `.github/workflows/build.yml:168` | ceiling | `19` | `ceiling KNOWN_SHADOWED_WRITES` | **not recorded** |
| `.github/workflows/build.yml:168` | ceiling | `2` | `ceiling KNOWN_NO_BLOCKS` | **not recorded** |
| `.github/workflows/build.yml:168` | ceiling | `2` | `ceiling TIME_GATED` | **not recorded** |
| `.github/workflows/mobile.yml:26` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/mobile.yml:42` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/mobile.yml:118` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/mobile.yml:212` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/release.yml:20` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/release.yml:42` | pin | `22` | `node-version` | **not recorded** |
| `.github/workflows/vendor-freshness.yml:32` | size-cap | `0` | `checkout fetch-depth` | **not recorded** |
| `.github/workflows/vendor-freshness.yml:37` | size-cap | `0` | `checkout fetch-depth` | **not recorded** |
| `.github/workflows/vendor-freshness.yml:42` | size-cap | `0` | `checkout fetch-depth` | **not recorded** |
| `.github/workflows/vendor-freshness.yml:56` | pin | `22` | `node-version` | **not recorded** |
