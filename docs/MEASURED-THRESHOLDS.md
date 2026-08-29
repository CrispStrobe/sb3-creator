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

> **These counts are the 2026-08-23 photograph and are kept as one.** Both
> denominators have since moved a long way — sb3-creator to 281 and
> brickwright-lite to 447 — and the sb3-creator half is now measured rather than
> merely counted. Skip to *Phase 2* below for the current state; the table at the
> end of this page is regenerated against it.

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

### 5. The one exact-equality pin, re-measured

`brickwright-lite`'s `circuit-corpus-invariants.test.mjs:151` is the third of the
three thresholds that surfaced by accident when the gates came back:

```js
assert.equal(files.length, 1034, 'the gate must cover the complete vendored corpus');
```

**RE-MEASURED 2026-08-23: 1034.** It is correct today, so nothing is owed here — but
it is worth naming as a shape, because it is the only exact equality among 459
literals and it behaves differently from every floor beside it. An equality fires in
**both** directions: it catches a corpus that shrank (which is the point) and also a
corpus that legitimately grew, which is what happened when a vendor sync added 58
circuits. The remedy that costs nothing to apply is to bump the number, and a
ratchet whose maintenance is "bump the number" becomes a rubber stamp.

A floor plus the recorded measurement — `>= 1000`, `// MEASURED 2026-08-23: 1034` —
keeps the coverage guarantee, still fires on a corpus that shrank, and does not
demand an edit when the gallery grows. Recorded rather than changed: the file is
brickwright-lite's.

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

## The suites

**CI on this branch is the authoritative run** — Node 22, siblings checked out at
the pinned revisions, and it executes the mutation prover, none of which this box
can reproduce (Node 20, and a load average of 26 while another eight agents work).

[`actions/runs/32662789508`](https://github.com/CrispStrobe/sb3-creator/actions/runs/32662789508)

```
Lint · test · build            success
  npm test        # tests 6472   # pass 6377   # fail 0   # skipped 95
  mutation prover 31/31 mutations caught
Browser render tests (WebGL)   success
  # tests 11   # pass 11   # fail 0   # skipped 0
```

Locally, `npm run test:fast` on the same commit:

```
# tests 1178   # pass 1173   # fail 0   # skipped 5
```

## A correction: I measured the wrong quantity for `--test-timeout`

The full suite on this box came back **6424 tests, 6326 pass, 4 fail, 92 skipped**,
and two of those four are the same failure:

```
not ok 16 - test/circuit-params-are-read.test.mjs
  duration_ms: 900103.670701
  failureType: 'testTimeoutFailure'
  error: 'test timed out after 900000ms'

not ok 38 - test/gallery-e2e.test.mjs
  duration_ms: 900320.274198
  failureType: 'testTimeoutFailure'
  error: 'test timed out after 900000ms'
```

Both pass in CI. Both exceeded 900 s here, at load 26.

Earlier in this campaign I measured the slowest **leaf** test at 133.5 s and
concluded that `--test-timeout 900000` carried ~6.7x headroom. **That was the wrong
quantity.** `failureType: 'testTimeoutFailure'` at `location: …:1:1` is the
FILE-level test timing out: when node runs a glob of files, the bound applies to
each file's whole wall clock, not to its slowest leaf. gallery-e2e is recorded in
`ci.yml` as a 242 s file on an unloaded developer box — so the real ratio is ~3.7x,
and 3.7x was not enough here.

This is not a number that wants raising. It belongs to the fourth shape named in
PLAN.md §27, **cannot-be-trusted-when-busy**: its failure is indistinguishable from
contention, and the remedy its own message suggests is the one that destroys it.
What it wants is the treatment the python checker got — a timeout that says *which*
of the two it is. Recorded as an open item rather than papered over with a bigger
constant, which is the mistake this whole campaign exists to stop.

The correction is worth stating on its own terms: the measurement was careful, the
arithmetic was right, and it was about the wrong quantity. That failure mode does
not announce itself, and the only thing that caught it was running the suite on a
machine slow enough to trip the bound.

## The two owed probes, delivered

Recorded as owed in the previous wave: both had been probed against a **stale rig**
(pins `d754cfc` → `b5761ad` had moved in a merge) and returned `UNTESTABLE`. That
verdict was retracted then; retracting "already red" does not entitle anyone to
write "fine", so they stayed open. Re-probed against the current pins
(`bw-board@dcaf05f`, `bw-circuit-ui@0a3ec00`), on a rig the probe now refuses to run
on unless it matches:

```
CAN-FIRE   test/gallery.test.mjs:225      floor=1    entry.difficulty >= 1
     margin: green up to 1, red from 2 -> observed 1, headroom 0%
CAN-FIRE   test/gallery.test.mjs:225      ceiling=5  entry.difficulty <= 5
     margin: green up to 4, red from 3 -> observed 4, headroom 20%
CAN-FIRE   test/gallery-e2e.test.mjs:567  floor=400  tone.hz > 400
CAN-FIRE   test/gallery-e2e.test.mjs:567  ceiling=480 tone.hz < 480
```

All four fire. Two things worth keeping from the margins: `entry.difficulty` runs
**1–4** across the gallery, so the declared 1–5 range has an unused slot at the top —
the ceiling is honest but the corpus has never used its full width; and the floor at
1 has **zero headroom**, which is correct for a scale whose bottom is defined rather
than measured.

`gallery-e2e:567` was probed without `--margin`: that file is roughly four minutes
per run against the pinned siblings, and a binary search over it costs more than the
answer is worth. `CAN-FIRE` is the question that was owed.

---

## Which budgets now discriminate, and which cannot

`PLAN.md` §27 named the fourth shape — **cannot-be-trusted-when-busy** — and
`test/helpers/timed.mjs` is the instrument for it. A test that hung burns CPU; an
oversubscribed machine does not give the process the CPU to burn. On Linux that
costs one file read: `/proc/self/stat` fields 16/17 are `cutime`/`cstime`, the CPU
of **reaped children**, so sampling either side of a synchronous `execFileSync`
gives exactly what that child burned — including one killed on timeout, because the
kill is followed by a reap.

### Routed

| budget | what it bounds | why it qualifies |
|---|---|---|
| `6502-oled-compile:55` — 30 s | `cl65` assembling a 6502 fixture | external compiler, expected to finish |
| `matrix-keypad-retarget:74` — 60 s | `cl65` on the generated calculator | same |
| `z80-calculator-retarget:67` — 60 s | `sdcc -mz80` on generated C | same |
| `test/helpers/python-syntax.mjs` — 30 s | `python3 ast.parse` | already had a distinguishable outcome; now carries the verdict too |
| lite `lesson-numeric-contract` — 15 s | an **in-process** bench-measurement deadline | uses `classifyElapsed()` + `selfCpuSeconds()`, the self-analogue |

### Not routed, with the reason

**The `vm.runInNewContext` budgets** — `exec:22` (800 ms), `extensions` ×5
(1000 ms), `vm:112`, `a2-sampler:76`, `js-driver-oled-chain:91`. Two reasons. The
CPU is our own thread rather than a child's, so the cheap `cutime` reading does not
apply; and more decisively, in `exec.test.mjs` **a timeout is the accepted
outcome** — the comment says so: a forever-loop game is "a clean *still running*,
not an error". There is nothing to explain.

**`settrace-codegen:138` — 5 s. NOT A BUDGET AT ALL, and this cost two red tests
before it was understood.** The traced program is a micro:bit `forever` loop with
`sleep` stubbed to a no-op: it never terminates, the 5 s is how it is **stopped**,
and the assertions read the partial stdout collected up to that moment. A timeout
there is the success path. Routing it turned the normal stop into a
`BudgetExceededError`.

Worth recording what did *not* catch that: `threshold-inventory.mjs` counts it as a
`timeout-ms` and `threshold-probe.mjs` reported it `CAN-FIRE`. Both statements are
true and both are beside the point — moving the number does change the verdict
without the number bounding anything. What caught it was checking whether the test
passed **before** the change at the same load, instead of assuming the red was the
box. **Before wrapping a `timeout:`, ask whether the work is expected to finish.**

**`ttl-module-acceptance:52` — 30 s.** Behind `BW_TTL_ORACLE=1` plus Java,
`Digital.jar` and a cloned `8bitsim`, so it cannot be exercised here at all.

### What the discriminator can and cannot separate

Confidently: **starved from computing.** That is the question that matters, because
a starved process called a hang sends someone hunting a defect that does not exist.

Not confidently: **unbounded work from bounded-but-throttled work.** Both compute
flat out. A third verdict was drafted for this, keyed on
`workCpu < budget × 0.8` — and it mis-classified the helper's own spinning stub,
because on a loaded box a genuine hang *also* fails to accumulate CPU worth 80% of
its budget. It relabelled real hangs as throttling, silently and in the reassuring
direction, which is the same failure as the absolute cut it was meant to improve
on. Telling them apart needs the CPU curve over time; a synchronous helper has one
observation. So the verdict is `cpu-bound`, reported with both numbers and the
reading each supports, and the caller decides.

Two calibrations, both measured rather than assumed, both on a deliberately busy
box because an instrument calibrated on an idle machine is calibrated for the
situation in which it is not needed:

- **The reference is measured at failure time.** A pure spinner on 4 cpus at load
  36 achieves ratio **0.12–0.17**, so an absolute cut of 0.5 would call every real
  hang "contention". `achievableCpuRatio()` is the median of three 600 ms samples —
  median rather than max or min, because max over-estimates what was achievable and
  pushes hangs towards contention.
- **Runtime startup is charged to the runtime.** `node -e ''` costs **min 0.040 /
  median 0.060 / max 0.070 s** of CPU for doing nothing. Over a short budget that
  dominates: the first version classified its own *sleeping* stub at share 0.13
  against a 0.15 cut.

### The retry became evidence-based

A blanket retry is how a load-flake is hidden along with the defect beside it. Once
the two are distinguishable the policy can be principled: `runBounded` retries once,
**opt-in per call site and only where the work is deterministic**, when the verdict
says the machine was at fault — never on the unbounded reading. The retry gets the
wall time the measured share implies (`budget / achievable`, capped at 10×), which
is not "raising the budget": the verdict is decided on **CPU consumed**, so a hang
cannot launder itself by being given longer. Every retry prints a line, because a
retry nobody can see hides how often the machine is the problem.

---

## The sb3-creator classification pass (2026-08-25, bw-audit)

The lite half (`brickwright-lite/docs/WAIT-CENSUS.md`) ended with a census rather than
probes, because its two findings needed no probing: 40 of 119 literals sat in `_tmp-`
scratch files nothing runs, and the population the inventory does not collect (249 fixed
sleeps against 119 bounds) was twice the size of the one it does.

**Both of those transferred badly, and saying so is the result.** Tested here, both
disproved:

- **No dead tier.** Of 250 sb3-creator literals, 212 unevidenced, **189 sit in files
  `npm test` actually globs**; 4 more are in `test/helpers/` (imported by files that do
  run), 13 in `scripts/` — several of which CI invokes — 4 in CI config, 2 in
  `package.json`. There is no `_tmp-` equivalent. Nothing here can be classified away.
- **No large uncollected population.** The inventory sees `> >= < <=` and named option
  keys, so an exact equality is invisible to it, and I expected that to hide a stricter
  class of bound. It does not. There are 1,683 exact-equality numeric sites; 562 are in a
  vendored browser bundle, and the rest are dominated by **expected results**
  (`assert.equal(run([…]).shown, 168)` — arithmetic, not a bound) and fixture shapes
  (`rom.length === 0x8000`, the 28C256 the bench draws). Narrowing to equality on a
  *measured count* leaves 143, still mostly "four comments captured" / "three scripts".
  The inventory's definition is holding; `waitForTimeout` had no analogue here.

So this half has to be probed, which is what the claim predicted: floors dominate
(171 of 212 unevidenced), and a floor's flip point is cheap to bisect where a browser
wait's is not.

### The floors, classified

**128 of the 171** guard a *population* — a `.length`, `.size`, `Object.keys`, a
`filter().length`. Their values: 53 at ≤1 (bare non-emptiness), 16 at 2–5, 25 at 6–20,
13 at 21–100, 16 at 101–1000, 5 above 1000. The other 43 bound something local.

### Headroom, measured without the rig

A corpus floor's risk is not its value but its **slack**: how much of the corpus can
disappear before it fires. That is directly countable — no probe, no siblings — and it is
where the pass paid off. Using each test's own glob:

| floor | site | floor | actual | can vanish first |
|---|---|---|---|---|
| `circuitFiles.length >= 1034` | `example-corpus-contract.test.mjs:37` | 1034 | 2099 | **50.7 %** |
| `files.length > 1500` ×4 | `kcl-residual`, `rail-short` | 1500 | 2099 | ~28.5 % |
| `> 900` ×4 | `flat-variants*`, `generated-bench-layout`, `vendor-flat-partitions` | 900 | 1006 | ~10.5 % |
| `dirs.length >= 250` ×2 | `program-reads-what-it-writes`, `vm-and-c-agree` | 250 | 279 | ~10.4 % |
| `index.length >= 259` ×4 | `example-corpus-contract`, `example-gate-enrolment`, … | 259 | 278 | 6.8 % |
| `generatedFiles.length >= 819` | `example-corpus-contract.test.mjs:38` | 819 | 870 | 5.9 % |
| `circuitFiles >= 2000` | `circuit-params-are-read.test.mjs:167` | 2000 | 2099 | 4.7 % |

**The worst one is this document's own opening story.** §1 of this page describes
`circuit-corpus-invariants`' pin of **1034** as "correct until a vendor added 58
circuits". It was corrected then and never revisited; the circuit corpus has since
reached 2,099, so **half of it could vanish before that floor notices**. The floor is not
wrong, it is *stale in the direction that costs nothing to leave alone* — which is how a
floor stops being a floor without anyone touching it.

The three rows below 7 % are the healthy shape: a ratchet close to its corpus.

Approximation stated: the ×4 / ×2 rows share a value and a corpus but not necessarily an
identical glob, so their slack is to the nearest whole corpus rather than exact. The four
exact rows were computed with the test's own glob semantics.

### What blocks the real probe, and it is not the code

`threshold-probe.mjs` answers the two questions headroom cannot — *can it fire at all*,
and where is the flip point. It refused to run:

```
RIG DOES NOT MATCH THE PINS — refusing to report:
  bw-board: rig is at 182b26b, test/fixtures/siblings.json pins a301937
  bw-circuit-ui: rig is at ba56542, siblings.json pins af5cc08
  bw-circuit-ui: SOURCE is modified (…) — this run is not reproducible
```

That is the instrument being right, and it is worth recording as a *property of this box*
rather than a defect: the sibling checkouts are other agents' live working trees, so a
probe run here would measure their work-in-progress instead of the pinned repo.
`--allow-rig-drift` exists and is the wrong answer.

The unblock is to clone both siblings at the pinned shas into a scratch rig and point
`BW_BOARD` / `BW_CIRCUIT_UI` at those, which touches nobody else's checkout. Until then
the probe work-list is ready and ordered — the 27 population floors at ≥100, worst slack
first — and the headroom column above already tells you which of them to do.

### The probe, run against a scratch rig (2026-08-25)

The blocker above was resolved without touching anyone's checkout: both siblings were
cloned from their local paths into `/mnt/volume1/code/wt/rig-thresholds` and checked out
**at the pinned shas** (`bw-board a301937`, `bw-circuit-ui af5cc08`), with `bw-board`'s two
dependencies installed from its own lockfile rather than symlinked to a live tree. 61 MB.
`threshold-probe.mjs` accepts it: *matches pin*, both clean.

**THE RUNTIME IS PART OF THE RIG, and I had not counted it.** Having fixed the sibling
axis I assumed the rig was complete. It was not: this box runs node 20.20.2 and CI pins
**22**. `test/example-corpus-contract.test.mjs` and `test/generated-bench-layout.test.mjs`
import `globSync` from `node:fs`, which does not exist before node 22, so those two files
cannot be **imported** here at all — they fail at module load, not at an assertion. That
blocks 4 of the 34 targets, including the worst one. A rig is siblings *and* runtime.

**29 of 29 probed floors CAN FIRE.** Not one is decoration; every floor tested guards a
code path that actually runs. That is a clean negative result and it relocates the value
of this pass entirely into the margins — there is nothing to repair in the *existence* of
these floors, only in their slack.

**Margins bisected, and they agree with the direct counts:**

| floor | probe says | direct count | agree |
|---|---|---|---|
| `kcl-residual:101` `> 1500` | green to 2098, red from 2099 | 2099 | yes |
| `flat-variants:92` `> 900` | green to 1005, red from 1006 | 1006 | yes |
| `expected-quantities-hold:148` `> 2300` | green to 2446, red from 2447 | 2447 | yes |

Two independent methods, three for three — which is what makes either believable, and the
same cross-check the lite half got when static analysis predicted 61.9 s of sleeping and
the sweep observed 65.9 s.

**One reconciliation, because two true numbers looked like a disagreement.** The probe
reports `kcl-residual`'s headroom as **40 %** and the table above reports **28.5 %**. Both
are right and they answer different questions: the probe measures the gap as a fraction of
**the floor** ((2098−1500)/1500 ≈ 40 %), the table as a fraction of **the corpus**
((2099−1500)/2099 ≈ 28.5 %) — *how much could vanish before it fires*. For a floor the
corpus denominator is the one that describes the risk, so it is the one used here; the
probe's is quoted as-is wherever it appears, rather than silently rescaled.

**Still standing, and unprobeable on this box:** `circuitFiles.length >= 1034` against an
actual 2099. Its can-fire is untested for want of node 22, but its slack does not need the
probe — the three bisections above establish that for a `>=` floor over a countable corpus
the flip point *is* the count, so the 50.7 % holds by the same arithmetic the instrument
just confirmed three times.

## Phase 2 (2026-08-29, fab-thresh): the rig re-pinned, the sweep made cheap, and the treadmill stopped

Phase 1 above ends parked, with a list of what it could not reach: three targets
unprobeable for want of node 22, twenty-five can-fire'd floors with no margin, and
everything below the `>= 100` cut untouched. This is that list, worked.

It opens with a number that says why the list mattered. Phase 1 counted **250**
bounding literals on 2026-08-25. Four days later the same instrument counts
**275**. Twenty-five arrived in between and not one arrived with evidence.
Measuring a backlog that grows faster than it is measured is not a campaign, and
the most important thing built in this phase is not a measurement at all — it is
`test/threshold-ratchet.test.mjs`, which stops the growth.

**Where it ended: 126 literals owed a measurement at the start, 27 at the end.**

### The first decision: the rig was four defect-waves stale

`/mnt/volume1/code/wt/rig-thresholds` was kept from phase 1 at `bw-board a301937`
and `bw-circuit-ui af5cc08`. `test/fixtures/siblings.json` now pins
`bw-board 4ae89b5` and `bw-circuit-ui 60fd117` — four defect waves later,
including the op-amp secant convergence, the gated output-limit change,
first-solve capacitor semantics, the attiny88 `pa0`→`gnd2` rename with its
135-circuit re-seat, and `engineKindFor`'s `hasDevice` collapse. Probing floors
against engines the suite no longer runs would measure the wrong repository, so
the rig was re-pinned before anything else was done with it.

Rebuilt as phase 1 describes it: both siblings fetched from the local checkouts
and detached at the pinned shas, `bw-board`'s dependencies installed with
`npm ci` **from its own lockfile**. That second half is not ceremony. The old
rig's `node_modules` held `avr8js` alone; the pinned `bw-board` also requires
`rp2040js`, so the stale rig could not have loaded the engine at all and every
verdict from it would have been about a missing module rather than about a
threshold. 73 MB, nobody else's checkout touched. `threshold-probe.mjs` accepts
it: *matches pin*, both clean.

**Verified with a known answer before it was trusted**, which is the discipline
phase 1 paid for when a drifted rig produced two findings that had to be
retracted. `generated-bench-layout:60` — `kept.length > 900` — bisected on the
re-pinned rig: green up to 1198, red from 1199. An independent `globSync` counts
1199 non-flat bench files. Two methods, one answer, and the answer sits exactly
where a strict `>` must flip.

### The three unprobeable targets, delivered

All three needed node 22 for `globSync`, which this box now has as a shared
toolchain at `/mnt/volume1/toolchain/local/node-v22.12.0-linux-x64`.

| target | bound | observed | flip point | can vanish first |
|---|---|---|---|---|
| `example-corpus-contract:36` | `index.length >= 259` | 310 | green 310, red 311 | 16.5 % |
| `example-corpus-contract:51` | `generatedFiles.length >= 819` | 946 | green 946, red 947 | 13.4 % |
| `generated-bench-layout:60` | `kept.length > 900` | 1199 | green 1198, red 1199 | 24.9 % |

**Zero unprobed targets remain.** All three CAN FIRE, which continues phase 1's
clean negative result: across both phases every floor tested guards a path that
actually runs, and not one is decoration.

### The count IS the flip point, so stop searching for it

Phase 1's most useful sentence is buried in its park-state: for a `>=` floor over
a countable corpus the flip point *is* the count. It bisected three floors to
establish that, at roughly two and a half minutes each, and every one landed on a
number a `globSync` had already produced in milliseconds.

`threshold-probe.mjs --expect-count` turns that finding into the method. Hand it
the count; it derives where the gate must flip and checks exactly that — green at
the flip point, red one past it. Two runs instead of a twenty-run binary search
over a range whose top end is a million. The off-by-one between `>` and `>=`, and
for a floor spelled as its own negation (`if (n < F) throw`), is written out in
the source rather than felt, and `test/threshold-ratchet.test.mjs` pins it against
margins that were actually observed — so a regression in the arithmetic would have
to contradict a measurement already in this document.

### A false RED, caught on the disagreement check's first outing

`example-corpus-contract:51` came back `CAN-FIRE` with its margin marked **NOT
CONFIRMED**: predicted flip at 946 from a count of 946, gate RED at 946 *and* RED
at 947. Both red is impossible for a floor whose corpus is 946.

Re-run alone, the identical edit is green — `# pass 4  # fail 0`. The confirm runs
had executed at load 40–70 with a second sweep of this lane's own on the box, and
a child killed under memory pressure exits non-zero, which `runGate` reads as RED.

The finding is not about that literal. It is that **a probe run beside other heavy
work produces false reds, and false reds in this instrument read as findings.** A
binary search would have swallowed it silently: it would have converged on a wrong
flip point and printed it with exactly the same confidence. What caught it was
having two methods and requiring them to agree. That is phase 1's lesson — *an
instrument that disagrees with the world is more often wrong than the world is,
and the way to tell is to have two of them* — arriving from the other direction,
because here the instrument disagreed with **itself**, and said so.

Consequently every probe batch in this phase records the box's load, and batch 2
onward ran under the fleet's `mkdir` build lock (`/mnt/volume1/code/wt/.build-lock`,
owner directive of the same day). A timing measurement taken next to a competing
build is not a measurement; a red/green one, it turns out, is no better.

| batch | what | under the lock | box load |
|---|---|---|---|
| rig rebuild (`npm ci`, 2 packages, 5 s) | re-pinning the siblings | no — predates the directive | 14 |
| probe batch 1 — the three globSync targets | `--margin`, `--expect-count` | no — predates the directive | 28 → 40 → 70 |
| observe batch 1 — 40 files | the whole countable sweep | yes (acquired mid-flight) | 53 → 16 |
| observe batch 2 — 8 files | the slow and awkward remainder | yes | 16 → 19 |
| `engine-surface-adoption` | one new file, see below | no — single targeted run | 14 |

The one measurement in this phase that a busy box could have corrupted is the
false RED above, and it is reported as a defect of the method rather than as a
finding about the code. Everything else the sweep produced is a **count**, which
does not care how loaded the machine is.

### One run, every bound: `scripts/threshold-observe.mjs`

The probe answers one literal per gate run. With 126 owing a measurement, that is
not a sweep. The new instrument moves no threshold at all — it rewrites each
decisive comparison into one that reports the quantity it bounds on the way past:

```js
files.length > 1500
// becomes
((__thrV) => (globalThis.__thrObserve('test/kcl-residual.test.mjs:101', __thrV), __thrV > 1500))(files.length)
```

so **one run of a file yields the observed value of every bound in it**, with the
verdict unchanged — and a run whose verdict *did* change has its numbers
discarded, because measurements of a program we do not have are not measurements.
The bounded expression is evaluated exactly once; the more obvious
`(report(x), x > 1500)` shape would have run
`readYieldMap(cOf(SCHEDULED, {debug: true})).length` twice, and that is a compile.

**49 files run; 48 of them stayed green under the rewrite, and 150 of the 166
bounds in those green runs were observed.** The forty-ninth is `gate-integrity`,
which reads this tree's own source — instrumenting the tree changes its subject,
so it went red and its twelve numbers were discarded, exactly as the instrument is
built to do. Sixteen bounds came back NOT REACHED; twelve of those are the whole
of `ttl-module-acceptance`, and the other four are discussed below.

Cross-checks, because one instrument agreeing with itself is not evidence:
`kcl-residual:101` observed **2162** against an independent glob of 2162; three
separate `index.length >= 259` sites observed **310** against a catalog of 310;
and `ctarget:1051` observed **4**, which is what phase 1 recorded for that ceiling
by binary search with a different instrument.

`scripts/threshold-stamp.mjs` writes the results back next to the numbers — 98
lines stamped. That is this campaign's actual unit of work: these values are
rarely wrong, but nobody could tell where they came from. It stamps **only the two
dispositions that owe a measurement**; putting "observed 963" above
`flat.length > 0` would be the rubber stamp the whole campaign exists to prevent.

### What the sweep found

**Bounds sitting exactly on their observed value — zero headroom, which is the
correct state for a ratchet and is now recorded as such:**

| where | bound | observed |
|---|---|---|
| `ctarget:342` / `ctarget:1021` | `labels.length >= 4` / `hardware.length >= 5` | 4 / 5 |
| `device-branch-agreement:121 / :124 / :154` | `>= 14` / `>= 27` / `<= 3` | 14 / 27 / 3 |
| `engine-surface-adoption:186` | `ENGINE_SURFACE.length >= 10` | 10 |
| `expected-quantities-hold:305` | `both.length >= 21` | 21 |
| `gallery-e2e:426` | `leds.length >= 8` | 8 |
| `input-polarity-survives:98` | `entry.devices.length >= 11` | 11 |
| `machine-roms-boot:303` | `before.length >= 16` | 16 |
| `reference-extensions-provenance:54 / :82 / :137` | `>= 8` / `>= 8` / `>= 17` | 8 / 8 / 17 |
| `settrace-codegen:62 / :94` | `>= 6` / `>= 6` | 6 / 6 |
| `stc12-conformance:188 / :242` | `>= 3` / `>= 5` | 3 / 5 |
| `vm:598` | `filled >= 4` | 4 |

**And the one that looks worst and must not be touched.**
`settrace-codegen:161` reads `seen.length >= 3` and observed **2266** — a floor at
0.13 % of the measured value, 755× of slack, by a wide margin the largest ratio in
the sweep. Every rule of thumb in this document says raise it.

It must not be raised, and the reason is a few lines above it in its own file:
`seen` counts line events streamed out of a Python program that **is stopped by a
5 s timeout**. The quantity is not a corpus; it is however much work the box got
through before the clock ran out. 2266 is what a machine at load 40 managed. A
quiet one would produce far more and a starved one far less, and a floor anywhere
near the observed value would fire on the first busy afternoon. The floor of 3 is
correct as written: it asks whether any line events arrived at all, which is the
only question a timeout-truncated stream can answer.

That deserves stating as a rule, because the sweep makes the class easy to
mistake: **the classifier sorts by SHAPE, and shape does not tell you whether the
quantity is stable.** `seen.length` looks exactly like `files.length`. What
separates them is reading what produced the number — and the observation is what
made the question askable in the first place.

The same reading *clears* two others that look similar and are not:
`machine-roms-boot:384` (`10 < lostCycles < 40`, observed 21.5 — a bracket around
a measured quantity with both sides live) and `pico-oled-chain:127`
(`sclEdges > 1000`, observed 45371), where the simulation runs for a fixed
*simulated* duration, so the count is deterministic and the slack is real. Those
are reported, not repaired — phase 1's bar for moving a value was a floor at half
its corpus, and nothing here reaches it.

**A recorded finding updated by the sweep.** Phase 1 measured `gallery.test.mjs:225`
and reported that `entry.difficulty` ran **1–4** across the gallery, so the declared
1–5 range had an unused slot at the top. It now observes **1…5 over 310 reaches**:
the corpus has since used its full declared width, and the ceiling is exactly tight.

### `arduino-import` produced zero tests and reported green

The sweep flagged `arduino-import:79` — the only bound in the file — as
**NOT REACHED** in a passing run. The file explains itself in one line:

```
# tests 0   # pass 0   # fail 0   # skipped 0
```

Every test there is generated inside `for (const ex of examples)`; `corpus/` is
gitignored and machine-local, and CI clones this repo alone. So on a fresh
checkout and in CI the loop generates nothing and the summary reports success.
Not a skip, which node:test prints — **zero tests, which it does not.** A skip is
indistinguishable from a pass, and an empty generator is worse, because it is
indistinguishable from both. This is the defect `test/CROSS-REPO-GATE-AUDIT.md`
was written about, arriving through a different door.

Repaired the way the sibling guards already do it: make the state visible rather
than invent a corpus requirement CI was never configured to meet. The file now
reports `# tests 1  # skipped 1` with the reason and the script that fetches the
corpus, so a reader of the summary can tell *the importer was exercised* from
*the importer was not there to exercise*.

The other three NOT REACHED bounds are honest and need no repair:
`circuit-json-roundtrip:198` and `corpus-generator:367` sit behind a `||` whose
left side short-circuits, and `retarget-gallery:58` is in a branch the corpus does
not take.

### What is owed, and the ratchet that stops it growing

Phase 1 left every unevidenced literal in one undifferentiated pile of 212. That
pile is not homogeneous, and treating it as if it were is what makes a sweep
unfinishable: it demands a measurement from numbers that are not measurements.
`threshold-inventory.mjs --classified` now sorts them by disposition:

| disposition | phase-2 start | phase-2 end | owes a measurement |
|---|---|---|---|
| evidenced | 39 | **142** | no |
| definitional (`length > 0`, `=== 0`) | 77 | 78 | no — the value is fixed by the type, not the world |
| load-sensitive (timeouts) | 24 | 24 | no — a quiet-box number in this document, never a bigger constant |
| no-trip (pins, size caps, concurrency) | 9 | 10 | no — the probe has no safe tripping value |
| countable | 80 | 19 | **yes** |
| runtime | 46 | 8 | **yes** |
| **total owing** | **126** | **27** | |

The 78 definitional literals are why the ratchet is survivable. `list.length > 0`
is not a threshold anybody guessed; a list is empty or it is not, there is no flip
point to find, and demanding a `MEASURED` comment on 78 correct assertions is
precisely how an evidence rule turns into a rubber stamp.

`test/threshold-ratchet.test.mjs` ratchets the last two rows at **zero headroom**,
deliberately the same shape as the four `brickwright-lite` waiver ceilings this
document holds up as correct. The population that owes a measurement cannot grow.
It may shrink freely, and a second test requires the ceiling to follow it down, so
a stale ceiling cannot quietly re-open the door it was installed to shut.

It is mutation-proven rather than asserted to work, in both directions and against
the real tree: planting `assert.ok(files.length >= 4321)` in `codegen.test.mjs`
takes it to **28 against a ceiling of 27** and reddens it; reverting returns it to
green; and unit cases plant the same floor *with* a measurement above it and
require the debt discharged, and a bare `length > 0` and require it to be free.

**The ratchet's first catch was its own author.** Its staleness bound
(`CEILING - owed <= 20`) is a bounding literal like any other, and the first run
came back 127 against a ceiling of 126 because of it. The response was the one
this document argues for throughout: record what the number is measured against —
a lane's output is ~100 discharged literals, so 20 is a fifth of one — rather than
raise the ceiling to fit it.

**It also caught a live one.** `test/engine-surface-adoption.test.mjs` arrived on
`main` from another lane while this phase ran, carrying two unevidenced countable
floors. They were measured (`files.length > 100` → 187, `ENGINE_SURFACE.length >= 10`
→ 10, the second at zero headroom) rather than allowed to raise the ceiling. That
is the ratchet doing its whole job on its first day.

### The 27 still owing, and why each is not a probe away

Not a backlog nobody looked at — every one is accounted for:

| n | where | why it is not measured |
|---|---|---|
| 12 | `ttl-module-acceptance` | behind `BW_TTL_ORACLE=1` plus Java, `Digital.jar` and a cloned `8bitsim`. All twelve reported NOT REACHED, which is the same verdict phase 1 recorded for that file's timeout. A fact about the environment, not about the numbers. |
| 6 | `gate-integrity` | it reads **this tree's own source** and asserts patterns over it, so instrumenting the tree changes its subject. The observed run went RED and its numbers were discarded, exactly as the instrument is built to do. These need the probe, one gate run each. |
| 4 | `assert-physics` | `tolerance:` values on option objects rather than comparisons — there is no comparison for the sweep to wrap. They are also *parsed from the fixture's own text* (`rawTol`), so the literal is a default, not a bound on a measured quantity. |
| 3 | `scripts/*` (`build-machine-roms`, `normalize-controller-seating`, `vendor-flat-partitions`) | no owning gate, so there is nothing to run them under. `--gate` can supply one; none of the three is reached by a test today. |
| 1 | `curriculum:21` | a `corpusFloor()` call. Its count sits behind a thunk rather than in a comparison, so the sweep sees no span. The helper already prints the count in its own failure message, which is the shape this campaign asks for. |
| 1 | `arduino-import:114` | the corpus is gitignored and absent here and in CI — see above. Now a visible skip rather than a silent zero. |

None of these is "unmeasured because nobody got to it". Two of the six groups are
environment, one is a self-reference the instrument correctly refuses to fake, and
three are shapes the sweep cannot see and says so.

### The counterpart repository, for the record

`brickwright-lite` now reports **447** bounding literals, up from 238 when this
document was first written. That is another lane's repository and its half of the
campaign is `brickwright-lite/docs/WAIT-CENSUS.md`; the number is recorded here
only so the next reader knows the denominator moved, and moved a long way, while
this half was being closed.

---

## Every bounding literal

Generated by `node scripts/threshold-inventory.mjs --markdown`, **2026-08-29**,
against `sb3-creator@9f3c6d5` and `brickwright-lite@dd5debbd7`. It replaces the
2026-08-23 table, which described 221 sb3-creator literals against a repository
that now has 281.

Two things to read it with:

A row saying **not recorded** is a QUESTION, not a verdict — see the four lite
ratchets above, which are unrecorded and perfectly tight.

The **disposition** column is the answer to that question where phase 2 could
give one. `evidenced` means a measurement is written beside the number;
`definitional` means there is nothing to measure, because the bound is fixed by
the type rather than by the world; `load-sensitive` and `no-trip` mean the number
must not be moved on the strength of a probe; and `countable` or `runtime` mean
the literal still owes a measurement and is one of the 27 accounted for above.


### `sb3-creator` — 281 bounding literals

| kind | count | with a recorded measurement |
|---|---|---|
| floor | 219 | 123 |
| timeout-ms | 22 | 0 |
| ceiling | 18 | 14 |
| tolerance | 10 | 6 |
| size-cap | 5 | 0 |
| pin | 3 | 0 |
| concurrency | 2 | 0 |
| timeout-min | 2 | 1 |

| disposition | count | owes a measurement |
|---|---|---|
| evidenced | 142 | no |
| definitional | 78 | no |
| countable | 19 | **yes** |
| runtime | 8 | **yes** |
| load-sensitive | 24 | no |
| no-trip | 10 | no |

| where | kind | value | bounds | disposition | measurement |
|---|---|---|---|---|---|
| `test/a2-sampler-behavior.test.mjs:76` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `test/a2-sampler-behavior.test.mjs:135` | concurrency | `1` | `concurrency: 1` | no-trip | **not recorded** |
| `test/arduino-import.test.mjs:80` | floor | `0` | `examples.length > 0` | definitional | **not recorded** |
| `test/arduino-import.test.mjs:114` | floor | `10` | `r.pseudocode.length > 10` | countable | **not recorded** |
| `test/assert-physics.test.mjs:109` | tolerance | `0.003` | `tolerance: parseFloat(netMvMatch[3]) / 1000` | runtime | **not recorded** |
| `test/assert-physics.test.mjs:165` | tolerance | `0` | `tolerance: rawTol === null ? 0 : (periodMatch[4] === '%' ? expected * rawTol / 100 : rawTol)` | runtime | **not recorded** |
| `test/assert-physics.test.mjs:185` | tolerance | `0.02` | `tolerance: rawTol === null ? expected * 0.02 : (pulseMatch[3] === '%' ? expected * rawTol / 100…` | runtime | **not recorded** |
| `test/assert-physics.test.mjs:200` | tolerance | `0.02` | `tolerance: rawTol === null ? expected * 0.02 : (toneMatch[3] === '%' ? expected * rawTol / 100 …` | runtime | **not recorded** |
| `test/bare-condition-truth.test.mjs:86` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `test/bare-condition-truth.test.mjs:97` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `test/basic-linemap.test.mjs:93` | floor | `1` | `idx >= 1` | definitional | **not recorded** |
| `test/basic-linemap.test.mjs:115` | floor | `0` | `Object.keys(r.lineMap).length > 0` | definitional | **not recorded** |
| `test/basic-sweep.test.mjs:27` | floor | `0` | `r.basic.length > 0` | definitional | **not recorded** |
| `test/basic-sweep.test.mjs:34` | floor | `0` | `r.basic.length > 0` | definitional | **not recorded** |
| `test/basic-sweep.test.mjs:50` | floor | `0` | `rb.pseudocode.length > 0` | definitional | **not recorded** |
| `test/basic-sweep.test.mjs:62` | floor | `0` | `rb.pseudocode.length > 0` | definitional | **not recorded** |
| `test/basic-sweep.test.mjs:75` | floor | `0` | `w.length > 0` | definitional | **not recorded** |
| `test/bench-invariants.test.mjs:58` | floor | `200` | `sidecars >= 200` | evidenced | // MEASURED FLOOR. Without one, a parts-data directory that moved or emptied |
| `test/bench-invariants.test.mjs:94` | floor | `1000` | `benchFiles.length >= 1000` | evidenced | `only ${benchFiles.length} bench files found under ${EXAMPLES} (expected ~1092) — ` + |
| `test/bench-invariants.test.mjs:97` | floor | `200` | `primary >= 200` | evidenced | `only ${primary} primary circuit.json benches found (expected ~222) — the file ` + |
| `test/bench-invariants.test.mjs:100` | floor | `800` | `suffixed >= 800` | evidenced | `only ${suffixed} device-suffixed benches found (expected ~870)`) |
| `test/calculator-frame.test.mjs:120` | floor | `1` | `blits > 1` | definitional | **not recorded** |
| `test/chost.test.mjs:71` | floor | `25` | `compiled >= 25` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/chost.test.mjs:231` | floor | `30` | `identical >= 30` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/circuit-json-roundtrip.test.mjs:182` | floor | `0` | `leds.length > 0` | definitional | **not recorded** |
| `test/circuit-json-roundtrip.test.mjs:198` | floor | `0` | `motors.length > 0` | definitional | **not recorded** |
| `test/circuit-json-roundtrip.test.mjs:215` | floor | `30` | `circuitCount >= 30` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/circuit-params-are-read.test.mjs:167` | floor | `100` | `engineFiles.length >= 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/circuit-params-are-read.test.mjs:171` | floor | `50` | `read.size >= 50` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/circuit-params-are-read.test.mjs:174` | floor | `2000` | `circuitFiles >= 2000` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/circuit-params-are-read.test.mjs:177` | floor | `30` | `sites.size >= 30` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/codegen.test.mjs:29` | floor | `20` | `py.length > 20` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/corpus-generator.test.mjs:367` | floor | `0` | `trace.events.length > 0` | definitional | **not recorded** |
| `test/corpus-generator.test.mjs:367` | floor | `0` | `trace.serial.length > 0` | definitional | **not recorded** |
| `test/corpus-generator.test.mjs:383` | floor | `100` | `code.length > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/ctarget.test.mjs:344` | floor | `4` | `labels.length >= 4` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build lock, |
| `test/ctarget.test.mjs:1025` | floor | `5` | `hardware.length >= 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build lock, |
| `test/ctarget.test.mjs:1057` | ceiling | `5` | `(forced.match(/warning:/g) \|\| []).length <= 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build lock, |
| `test/ctarget.test.mjs:1855` | floor | `0` | `map.length > 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:1899` | floor | `0` | `readYieldMap(cOf(SCHEDULED, {debug: true})).length > 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:1911` | floor | `0` | `readYieldMap(debug).length > 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:1980` | floor | `0` | `yields.length > 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:1985` | floor | `0` | `y.block.length > 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:3275` | floor | `0` | `first >= 0` | definitional | **not recorded** |
| `test/ctarget.test.mjs:3287` | floor | `0` | `r.stats.mapped > 0` | definitional | **not recorded** |
| `test/cube-directions.test.mjs:31` | floor | `6` | `corpusFloor("cube directions")` | evidenced | // MEASURED 2026-08-23: 6 directions. Several tests here are generated from |
| `test/curriculum.test.mjs:18` | floor | `45` | `corpusFloor("curriculum stations")` | evidenced | // MEASURED 2026-08-23: 5 trails, 15 chapters, 53 stations; 274 index entries. |
| `test/curriculum.test.mjs:21` | floor | `250` | `corpusFloor("example ids the curriculum is checked against")` | runtime | **not recorded** |
| `test/debug-micropython.test.mjs:36` | floor | `8` | `corpusFloor("micro:bit examples discovered from examples/index.json")` | evidenced | // MEASURED 2026-08-23: 9 of 274 index.json entries. The corpus is DISCOVERED by |
| `test/debug-trace-audit.test.mjs:36` | floor | `14` | `corpusFloor("MicroPython examples discovered from examples/index.json")` | evidenced | // MEASURED 2026-08-23: 16 of 274 index.json entries. Same shape as |
| `test/decompile.test.mjs:98` | floor | `0` | `c.warnings.length > 0` | definitional | **not recorded** |
| `test/device-branch-agreement.test.mjs:123` | floor | `14` | `benches.length >= 14` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/device-branch-agreement.test.mjs:128` | floor | `27` | `s.length >= 27` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/device-branch-agreement.test.mjs:160` | ceiling | `3` | `left.length <= 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/device-branch-agreement.test.mjs:195` | floor | `69` | `reached.size >= 69` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/device-coverage.test.mjs:82` | floor | `110` | `engineKinds.length < 110` | evidenced | // 80 was measured in the snapshot era and went stale: MEASURED 2026-08-23 |
| `test/device-coverage.test.mjs:284` | floor | `78` | `engineKinds.length >= 78` | evidenced | // MEASURED 2026-08-23 against bw-board@caeac2b: 118 kinds live, 82 in the |
| `test/device-coverage.test.mjs:293` | floor | `110` | `engineKinds.length >= 110` | evidenced | `the live engine reported only ${engineKinds.length} kinds (expected ~118)`) |
| `test/embed-bundle.test.mjs:55` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `test/embed-bundle.test.mjs:83` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `test/embed-bundle.test.mjs:87` | floor | `5` | `devices.length > 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/engine-surface-adoption.test.mjs:122` | floor | `100` | `files.length > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, quiet-ish box, load 14): |
| `test/engine-surface-adoption.test.mjs:190` | floor | `10` | `ENGINE_SURFACE.length >= 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, quiet-ish box, load 14): |
| `test/example-corpus-contract.test.mjs:39` | floor | `259` | `index.length >= 259` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/example-corpus-contract.test.mjs:53` | floor | `1970` | `circuitFiles.length >= 1970` | evidenced | // MEASURED 2026-08-25: circuitFiles is 2099. The floor was 1034 — set |
| `test/example-corpus-contract.test.mjs:56` | floor | `819` | `generatedFiles.length >= 819` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/example-gate-enrolment.test.mjs:63` | floor | `259` | `Object.keys(computed.map).length >= 259` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/example-gate-enrolment.test.mjs:67` | floor | `10` | `ENROLMENT.length >= 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/example-gate-enrolment.test.mjs:94` | floor | `10` | `readers.length >= 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/example-kind-matches-content.test.mjs:77` | floor | `259` | `index.length >= 259` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/example-kind-matches-content.test.mjs:81` | floor | `100` | `withBlocks >= 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/example-kind-matches-content.test.mjs:85` | floor | `100` | `without >= 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/exec.test.mjs:22` | timeout-ms | `800` | `timeout: 800` | load-sensitive | **not recorded** |
| `test/exec.test.mjs:34` | floor | `30` | `corpusFloor("examples to execute")` | evidenced | // one. MEASURED 2026-08-23: src/utils/examples.js exports 35 examples, 30 of them non-ha… |
| `test/expected-quantities-hold.test.mjs:150` | floor | `2300` | `L.total > 2300` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/expected-quantities-hold.test.mjs:155` | floor | `180` | `dirs.size > 180` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/expected-quantities-hold.test.mjs:177` | floor | `1225` | `compared >= 1225` | evidenced | // The ratchet. 1224/2356 = 52.0 % on 2026-08-24 against bw-board |
| `test/expected-quantities-hold.test.mjs:212` | floor | `175` | `byOwnMaths.length >= 175` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/expected-quantities-hold.test.mjs:223` | floor | `85` | `solvedCurrents.length >= 85` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/expected-quantities-hold.test.mjs:268` | floor | `6` | `withR.length >= 6` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/expected-quantities-hold.test.mjs:317` | floor | `21` | `both.length >= 21` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/extension-coverage.test.mjs:70` | floor | `100` | `COMPILED >= 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/extension-coverage.test.mjs:75` | floor | `10` | `AUTHORED.stc12.size >= 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/extensions.test.mjs:66` | timeout-ms | `1000` | `timeout: 1000` | load-sensitive | **not recorded** |
| `test/extensions.test.mjs:189` | timeout-ms | `1000` | `timeout: 1000` | load-sensitive | **not recorded** |
| `test/extensions.test.mjs:276` | timeout-ms | `1000` | `timeout: 1000` | load-sensitive | **not recorded** |
| `test/extensions.test.mjs:338` | timeout-ms | `1000` | `timeout: 1000` | load-sensitive | **not recorded** |
| `test/extensions.test.mjs:410` | timeout-ms | `1000` | `timeout: 1000` | load-sensitive | **not recorded** |
| `test/extensions.test.mjs:485` | floor | `15` | `Object.keys(reg).length >= 15` | evidenced | `only ${Object.keys(reg).length} runtime extensions registered (expected ~19)`) |
| `test/extensions.test.mjs:487` | floor | `700` | `ops >= 700` | evidenced | `only ${ops} runtime-extension ops walked (expected ~775) — the declarative ` + |
| `test/faceplate-layouts.test.mjs:40` | floor | `11` | `layouts.length >= 11` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/features.test.mjs:207` | floor | `0` | `jump.sampleCount > 0` | definitional | **not recorded** |
| `test/features.test.mjs:208` | floor | `0` | `meow.sampleCount > 0` | definitional | **not recorded** |
| `test/features.test.mjs:243` | floor | `5` | `base.n > 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/features.test.mjs:335` | floor | `2` | `c.project.monitors.length >= 2` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/flat-variants-manifest.test.mjs:67` | floor | `900` | `MANIFEST.entries.length > 900` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/flat-variants-manifest.test.mjs:127` | floor | `0` | `mutated.wires.length > 0` | definitional | **not recorded** |
| `test/flat-variants.test.mjs:82` | floor | `900` | `pairs.length > 900` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/flat-variants.test.mjs:90` | floor | `900` | `pairs.length > 900` | evidenced | // would otherwise loop over an empty array and PASS — observed 2026-08-23, |
| `test/gallery-e2e.test.mjs:363` | floor | `0` | `board.parts.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:394` | floor | `0` | `board.parts.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:402` | floor | `0` | `state.omega >= 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:417` | tolerance | `0.1` | `bSink > 0.1` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/gallery-e2e.test.mjs:420` | tolerance | `0.02` | `bSource < 0.02` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/gallery-e2e.test.mjs:426` | floor | `0` | `board.parts.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:432` | floor | `8` | `leds.length >= 8` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build |
| `test/gallery-e2e.test.mjs:437` | floor | `0` | `board.parts.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:543` | floor | `0` | `board.parts.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:545` | floor | `0` | `buzzers.length > 0` | definitional | **not recorded** |
| `test/gallery-e2e.test.mjs:558` | floor | `400` | `tone.hz > 400` | evidenced | `expected ~440 Hz, got ${tone.hz.toFixed(1)} Hz`) |
| `test/gallery-e2e.test.mjs:558` | ceiling | `480` | `tone.hz < 480` | evidenced | `expected ~440 Hz, got ${tone.hz.toFixed(1)} Hz`) |
| `test/gallery-e2e.test.mjs:583` | floor | `0` | `r.reasons.length > 0` | definitional | **not recorded** |
| `test/gallery-roundtrip.test.mjs:42` | floor | `0` | `project.targets.length > 0` | definitional | **not recorded** |
| `test/gallery-roundtrip.test.mjs:73` | floor | `40` | `exampleDirs.length >= 40` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/gallery.test.mjs:93` | floor | `0` | `code.length > 0` | definitional | **not recorded** |
| `test/gallery.test.mjs:135` | floor | `0` | `js.length > 0` | definitional | **not recorded** |
| `test/gallery.test.mjs:171` | floor | `0` | `circuit.vcc > 0` | definitional | **not recorded** |
| `test/gallery.test.mjs:205` | floor | `100` | `content.length > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/gallery.test.mjs:229` | floor | `1` | `entry.difficulty >= 1` | definitional | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/gallery.test.mjs:229` | ceiling | `5` | `entry.difficulty <= 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/gate-integrity.test.mjs:129` | floor | `40` | `scanned >= 40` | runtime | **not recorded** |
| `test/gate-integrity.test.mjs:131` | floor | `12` | `crossRepo >= 12` | runtime | **not recorded** |
| `test/gate-integrity.test.mjs:235` | floor | `11` | `uses.length >= 11` | countable | **not recorded** |
| `test/gate-integrity.test.mjs:261` | floor | `2` | `installs.length >= 2` | countable | **not recorded** |
| `test/gate-integrity.test.mjs:307` | floor | `8` | `targets.length >= 8` | countable | **not recorded** |
| `test/gate-integrity.test.mjs:330` | floor | `200` | `files.length >= 200` | countable | **not recorded** |
| `test/gate-integrity.test.mjs:427` | floor | `40` | `scanned >= 40` | evidenced | // stopped matching". MEASURED 2026-08-23: 90 files, 24 sibling paths. |
| `test/gate-integrity.test.mjs:430` | floor | `15` | `siblingPathsSeen >= 15` | evidenced | '(expected ~24). Every pattern here may have stopped matching, in which ' + |
| `test/gate-integrity.test.mjs:467` | floor | `80` | `inv.rows.length >= 80` | evidenced | // default. MEASURED 2026-08-23: 88 files, 47 of them corpus-driven. |
| `test/gate-integrity.test.mjs:474` | floor | `40` | `corpusDriven.length >= 40` | evidenced | `only ${corpusDriven.length} corpus-driven files recognised (expected ~47) — ` + |
| `test/gate-integrity.test.mjs:566` | floor | `0` | `circ.board.parts.length > 0` | definitional | **not recorded** |
| `test/gate-integrity.test.mjs:566` | floor | `0` | `circ.board.nets.length > 0` | definitional | **not recorded** |
| `test/generated-bench-layout.test.mjs:56` | floor | `0` | `flat.length > 0` | definitional | **not recorded** |
| `test/generated-bench-layout.test.mjs:62` | floor | `900` | `kept.length > 900` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/index-metadata-matches-disk.test.mjs:89` | floor | `259` | `index.length >= 259` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/index-metadata-matches-disk.test.mjs:92` | floor | `14` | `seen.size >= 14` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/input-polarity-survives.test.mjs:100` | floor | `11` | `entry.devices.length >= 11` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/input-polarity-survives.test.mjs:169` | floor | `10` | `checked >= 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/js-driver-oled-chain.test.mjs:68` | floor | `0` | `circ.board.parts.length > 0` | definitional | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:68` | floor | `0` | `circ.board.nets.length > 0` | definitional | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:88` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `test/js-driver-oled-chain.test.mjs:100` | floor | `20` | `sdaEdges > 20` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/js-driver-oled-chain.test.mjs:107` | floor | `20` | `lit >= 20` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): lit |
| `test/kcl-residual.test.mjs:91` | floor | `1500` | `files.length > 1500` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/kcl-residual.test.mjs:99` | floor | `1500` | `files.length > 1500` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/kcl-residual.test.mjs:180` | floor | `1900` | `circuitsSolved > 1900` | evidenced | // Floors are MEASURED, not invented. On 2026-08-23 this corpus gives |
| `test/kcl-residual.test.mjs:182` | floor | `30` | `netsChecked >= 30` | evidenced | 'only ' + netsChecked + ' nets were checkable (expected ~37) - either the ' + |
| `test/live.test.mjs:44` | floor | `0` | `size > 0` | definitional | **not recorded** |
| `test/live.test.mjs:46` | floor | `1` | `project.targets.length >= 1` | definitional | **not recorded** |
| `test/live.test.mjs:89` | floor | `1` | `Object.keys(stage.broadcasts).length >= 1` | definitional | **not recorded** |
| `test/machine-roms-boot.test.mjs:116` | ceiling | `1000` | `Math.abs(g - 100_000) < 1000` | evidenced | `each lamp is ~100,000 cycles at 1 MHz; measured ${g}`) |
| `test/machine-roms-boot.test.mjs:120` | ceiling | `8000` | `Math.abs(sweep - 800_000) < 8000` | evidenced | `EXPECTED.md documents an 800 ms sweep; measured ${(sweep / 1000).toFixed(1)} ms`) |
| `test/machine-roms-boot.test.mjs:265` | tolerance | `0.005` | `Math.abs(sweep / 7372800 - 0.8) < 0.005` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:307` | floor | `16` | `before.length >= 16` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:360` | floor | `100` | `isr > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:361` | floor | `0` | `fg > 0` | definitional | **not recorded** |
| `test/machine-roms-boot.test.mjs:369` | ceiling | `1` | `Math.abs(mean - 4097) < 1` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:376` | floor | `1` | `new Set(periods).size > 1` | definitional | **not recorded** |
| `test/machine-roms-boot.test.mjs:381` | floor | `4090` | `Math.min(...periods) >= 4090` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:381` | ceiling | `4104` | `Math.max(...periods) <= 4104` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:398` | floor | `10` | `lostCycles > 10` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/machine-roms-boot.test.mjs:398` | ceiling | `40` | `lostCycles < 40` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/matrix-keypad-retarget.test.mjs:28` | floor | `1` | `pbPins.length >= 1` | definitional | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:29` | floor | `1` | `mkPins.length >= 1` | definitional | **not recorded** |
| `test/matrix-keypad-retarget.test.mjs:93` | floor | `17` | `pools.matrix.rows.length * pools.matrix.cols.length >= 17` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/micropython-pico-roundtrip.test.mjs:47` | floor | `15` | `authored.length >= 15` | evidenced | // MEASURED 2026-08-23: 70-calculator declares 19 PINs. The per-pin assertions |
| `test/multimeter-chain.test.mjs:82` | floor | `200` | `sidecars >= 200` | evidenced | // MEASURED 2026-08-23: 239 sidecars in bw-circuit-ui@d754cfc. Same floor as |
| `test/multimeter-chain.test.mjs:88` | floor | `0` | `circ.board.parts.length > 0` | definitional | **not recorded** |
| `test/multimeter-chain.test.mjs:88` | floor | `0` | `circ.board.nets.length > 0` | definitional | **not recorded** |
| `test/multimeter-chain.test.mjs:128` | floor | `200` | `sidecars >= 200` | evidenced | // MEASURED 2026-08-23: 239 sidecars in bw-circuit-ui@d754cfc. Same floor as |
| `test/multimeter-chain.test.mjs:134` | floor | `0` | `circ.board.parts.length > 0` | definitional | **not recorded** |
| `test/multimeter-chain.test.mjs:134` | floor | `0` | `circ.board.nets.length > 0` | definitional | **not recorded** |
| `test/oled-flush.test.mjs:78` | floor | `1` | `count(py, '_oled.show()') > 1` | definitional | **not recorded** |
| `test/pico-oled-chain.test.mjs:96` | floor | `0` | `circ.board.parts.length > 0` | definitional | **not recorded** |
| `test/pico-oled-chain.test.mjs:96` | floor | `0` | `circ.board.nets.length > 0` | definitional | **not recorded** |
| `test/pico-oled-chain.test.mjs:119` | floor | `1000` | `sclEdges > 1000` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/pico-oled-chain.test.mjs:122` | floor | `100` | `sdaEdges > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/pico-oled-chain.test.mjs:125` | floor | `3` | `board.readAnalog('GP0') > 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/pico-oled-chain.test.mjs:132` | floor | `20` | `lit0 >= 20` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): li… |
| `test/program-reads-what-it-writes.test.mjs:110` | floor | `250` | `dirs.length >= 250` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/program-reads-what-it-writes.test.mjs:116` | floor | `80` | `withVars >= 80` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/python-syntax-contract.test.mjs:74` | floor | `20000` | `PY_BUDGET_DEFAULT_MS >= 20_000` | evidenced | // MEASURED 2026-08-23, 25 consecutive runs of the exact command on a box at |
| `test/rail-short.test.mjs:87` | floor | `1500` | `files.length > 1500` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/rail-short.test.mjs:95` | floor | `1500` | `files.length > 1500` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/reference-extensions-provenance.test.mjs:56` | floor | `8` | `onDisk.length >= 8` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/reference-extensions-provenance.test.mjs:86` | floor | `8` | `manifest.entries.length >= 8` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/reference-extensions-provenance.test.mjs:143` | floor | `17` | `slugs.length >= 17` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/retarget-amplification.test.mjs:32` | floor | `35` | `corpusFloor("retargetable programs in examples/index.json")` | evidenced | // MEASURED 2026-08-23: 40 of 274 index.json entries. Both halves of this filter |
| `test/retarget-amplification.test.mjs:173` | floor | `0` | `trace.events.length > 0` | definitional | **not recorded** |
| `test/retarget-amplification.test.mjs:173` | floor | `0` | `trace.pwm.length > 0` | definitional | **not recorded** |
| `test/retarget-amplification.test.mjs:174` | floor | `0` | `trace.devices.length > 0` | definitional | **not recorded** |
| `test/retarget-gallery.test.mjs:58` | floor | `0` | `i >= 0` | definitional | **not recorded** |
| `test/retarget-gallery.test.mjs:88` | floor | `100` | `out.length > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load |
| `test/retarget.test.mjs:153` | floor | `200` | `out.length > 200` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/roundtrip.test.mjs:29` | floor | `25` | `corpusFloor("examples to round-trip (non-hardware)")` | evidenced | // MEASURED 2026-08-23: src/utils/examples.js exports 35 examples, 30 of them non-hardwar… |
| `test/settrace-codegen.test.mjs:64` | floor | `6` | `entries.length >= 6` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/settrace-codegen.test.mjs:98` | floor | `6` | `d.positions.length >= 6` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/settrace-codegen.test.mjs:157` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `test/settrace-codegen.test.mjs:167` | floor | `3` | `seen.length >= 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/settrace-codegen.test.mjs:191` | floor | `2` | `stack.length >= 2` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/shape-coverage.test.mjs:92` | floor | `0` | `kinds > 0` | definitional | **not recorded** |
| `test/shape-coverage.test.mjs:93` | floor | `0` | `filled > 0` | definitional | **not recorded** |
| `test/shape-coverage.test.mjs:100` | floor | `0` | `description.length > 0` | definitional | **not recorded** |
| `test/simulator-driver-controls-respond.test.mjs:152` | floor | `33` | `benches >= 33` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): be… |
| `test/simulator-driver-controls-respond.test.mjs:155` | floor | `67` | `pins >= 67` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): pi… |
| `test/stc12-conformance.test.mjs:69` | floor | `25` | `STC12.opcodes.size >= 25` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stc12-conformance.test.mjs:74` | floor | `5` | `LEDCUBE.opcodes.size >= 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stc12-conformance.test.mjs:77` | floor | `0` | `STC12.args[op].size > 0` | definitional | **not recorded** |
| `test/stc12-conformance.test.mjs:194` | floor | `3` | `names.length >= 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stc12-conformance.test.mjs:234` | floor | `4` | `roots.length >= 4` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stc12-conformance.test.mjs:252` | floor | `5` | `Object.keys(MANIFEST.snapshots).length >= 5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stm32f0-chain.test.mjs:76` | floor | `6` | `pa0.changes >= 6` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stm32f0-chain.test.mjs:76` | ceiling | `9` | `pa0.changes <= 9` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stm32f0-chain.test.mjs:81` | tolerance | `0.9` | `Number(m.stats.sleptNs) / 3e9 > 0.9` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stm32f0-chain.test.mjs:145` | floor | `3` | `nums.length >= 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/stm32f0-chain.test.mjs:161` | tolerance | `0.03` | `Math.abs(duty - 0.3) < 0.03` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/threshold-ratchet.test.mjs:92` | floor | `200` | `all.length >= 200` | evidenced | `only ${all.length} bounding literals found (counted 275 on 2026-08-29) — ` + |
| `test/threshold-ratchet.test.mjs:144` | ceiling | `20` | `CEILING - owed.length <= 20` | evidenced | // MEASURED 2026-08-29: 99 literals discharged in one sweep; 20 is a fifth |
| `test/timeout-discriminator.test.mjs:155` | tolerance | `0.5` | `spin.share - sleep.share > 0.5` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/timeout-discriminator.test.mjs:166` | timeout-ms | `30000` | `timeout: 30_000` | load-sensitive | **not recorded** |
| `test/trace-oracle.test.mjs:172` | ceiling | `2` | `Math.abs(t.events[0].tMs - 300) <= 2` | evidenced | // MEASURED 2026-08-23 (threshold-probe --margin): the event lands on EXACTLY |
| `test/trace-oracle.test.mjs:178` | floor | `800` | `t.events[1].tMs >= 800` | evidenced | // MEASURED 2026-08-23: observed 800 exactly, so 910 carries 12% headroom — |
| `test/trace-oracle.test.mjs:178` | ceiling | `910` | `t.events[1].tMs <= 910` | evidenced | // MEASURED 2026-08-23: observed 800 exactly, so 910 carries 12% headroom — |
| `test/trace-oracle.test.mjs:303` | floor | `0` | `t.events.length > 0` | definitional | **not recorded** |
| `test/trace-oracle.test.mjs:533` | floor | `500` | `t.serial[0].tMs >= 500` | evidenced | // MEASURED 2026-08-23: observed 500 exactly; 510 is 2% headroom. Tight, and |
| `test/trace-oracle.test.mjs:533` | ceiling | `510` | `t.serial[0].tMs <= 510` | evidenced | // MEASURED 2026-08-23: observed 500 exactly; 510 is 2% headroom. Tight, and |
| `test/transparency.test.mjs:63` | floor | `25` | `corpusFloor("examples under the permutation matrix")` | evidenced | // on purpose and nobody would notice losing. MEASURED 2026-08-23: src/utils/examples.js … |
| `test/ttl-module-acceptance.test.mjs:52` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:65` | floor | `5` | `circuit.parts.length >= 5` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:66` | floor | `10` | `circuit.wires.length >= 10` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:72` | floor | `4` | `leds.length >= 4` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:79` | floor | `5` | `clockWires.length >= 5` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:91` | floor | `4` | `aSide.length >= 4` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:126` | floor | `4` | `muxYWires.length >= 4` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:130` | floor | `4` | `leds.length >= 4` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:133` | floor | `20` | `circuit.wires.length >= 20` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:147` | floor | `10` | `circuit.parts.length >= 10` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:148` | floor | `20` | `circuit.wires.length >= 20` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:162` | floor | `10` | `circuit.parts.length >= 10` | countable | **not recorded** |
| `test/ttl-module-acceptance.test.mjs:163` | floor | `20` | `circuit.wires.length >= 20` | countable | **not recorded** |
| `test/vm-and-c-agree-on-arithmetic.test.mjs:111` | floor | `250` | `dirs.length >= 250` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/vm-and-c-agree-on-arithmetic.test.mjs:114` | floor | `100` | `targets >= 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/vm.test.mjs:112` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `test/vm.test.mjs:170` | concurrency | `1` | `concurrency: 1` | no-trip | **not recorded** |
| `test/vm.test.mjs:182` | floor | `1` | `vm.runtime.targets.length >= 1` | definitional | **not recorded** |
| `test/vm.test.mjs:488` | floor | `0` | `tgt >= 0` | definitional | **not recorded** |
| `test/vm.test.mjs:500` | floor | `3` | `revealed > 3` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/vm.test.mjs:595` | floor | `18` | `lowest >= 18` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/vm.test.mjs:604` | floor | `4` | `filled >= 4` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/wire-endpoint-adoption.test.mjs:102` | floor | `100` | `files.length > 100` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53): |
| `test/wire-endpoint-adoption.test.mjs:106` | floor | `0` | `hits.size > 0` | definitional | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:25` | floor | `1` | `inPins.length >= 1` | definitional | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:26` | floor | `1` | `mkPins.length >= 1` | definitional | **not recorded** |
| `test/z80-calculator-retarget.test.mjs:87` | floor | `17` | `pools.matrix.rows.length * pools.matrix.cols.length >= 17` | evidenced | // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, batch 2 under the fleet build lock, |
| `test/helpers/corpus-floor.mjs:44` | floor | `1` | `floor < 1` | definitional | **not recorded** |
| `test/helpers/downstream.mjs:62` | ceiling | `0` | `missing.length > 0` | definitional | **not recorded** |
| `test/helpers/timed.mjs:170` | timeout-ms | `30000` | `timeout: 30_000` | load-sensitive | **not recorded** |
| `test/helpers/timed.mjs:394` | floor | `0` | `budgetMs <= 0` | definitional | **not recorded** |
| `scripts/build-machine-roms.mjs:235` | ceiling | `127` | `d > 127` | runtime | **not recorded** |
| `scripts/gen-runtime-registry.mjs:143` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:130` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:280` | floor | `0` | `at < 0` | definitional | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:681` | floor | `0` | `open < 0` | definitional | **not recorded** |
| `scripts/mutation-prove-conformance.mjs:791` | ceiling | `0` | `backups.size > 0` | definitional | **not recorded** |
| `scripts/normalize-controller-seating.mjs:35` | floor | `900` | `files.length < 900` | countable | **not recorded** |
| `scripts/oracle-bbcsdl.mjs:73` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/settrace-smoke.mjs:131` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/settrace-smoke.mjs:141` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/starve-gate.mjs:156` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/threshold-observe.mjs:152` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/threshold-probe.mjs:174` | floor | `0` | `idx < 0` | definitional | **not recorded** |
| `scripts/threshold-probe.mjs:217` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/threshold-probe.mjs:247` | size-cap | `67108864` | `maxBuffer: 64 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/vendor-flat-partitions.mjs:125` | floor | `900` | `pairs.length < 900` | countable | **not recorded** |
| `.github/workflows/ci.yml:125` | timeout-min | `30` | `job/step timeout` | load-sensitive | # a four-minute file on a developer box (measured 242 s, 45/45) and this |
| `.github/workflows/ci.yml:143` | timeout-min | `25` | `job/step timeout` | load-sensitive | **not recorded** |
| `.github/workflows/ci.yml:70` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/ci.yml:168` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/ci.yml:198` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `package.json:14` | timeout-ms | `900000` | `--test-timeout` | load-sensitive | **not recorded** |
| `package.json:22` | ceiling | `0` | `eslint --max-warnings` | definitional | **not recorded** |

### `brickwright-lite` — 447 bounding literals

| kind | count | with a recorded measurement |
|---|---|---|
| floor | 202 | 4 |
| timeout-ms | 158 | 0 |
| tolerance | 35 | 2 |
| ceiling | 31 | 0 |
| size-cap | 11 | 0 |
| pin | 8 | 0 |
| timeout-min | 2 | 0 |

| disposition | count | owes a measurement |
|---|---|---|
| evidenced | 5 | no |
| definitional | 101 | no |
| countable | 49 | **yes** |
| runtime | 113 | **yes** |
| load-sensitive | 160 | no |
| no-trip | 19 | no |

| where | kind | value | bounds | disposition | measurement |
|---|---|---|---|---|---|
| `test/about-data.test.mjs:23` | floor | `8` | `titles.length >= 8` | countable | **not recorded** |
| `test/app-icon.test.mjs:117` | floor | `244` | `r > 244` | runtime | **not recorded** |
| `test/app-icon.test.mjs:117` | floor | `244` | `g > 244` | runtime | **not recorded** |
| `test/app-icon.test.mjs:117` | floor | `244` | `b > 244` | runtime | **not recorded** |
| `test/app-icon.test.mjs:127` | floor | `120` | `b > 120` | runtime | **not recorded** |
| `test/app-store-metadata.test.mjs:29` | floor | `500` | `copy.length > 500` | countable | **not recorded** |
| `test/app-store-metadata.test.mjs:30` | ceiling | `4000` | `copy.length <= 4000` | countable | **not recorded** |
| `test/app-store-metadata.test.mjs:112` | floor | `3` | `body.split('\n').length > 3` | countable | **not recorded** |
| `test/app-store-metadata.test.mjs:115` | ceiling | `4000` | `body.length <= 4000` | countable | **not recorded** |
| `test/arduboy.test.mjs:80` | floor | `20000` | `game.bytesToDisplay > 20_000` | runtime | **not recorded** |
| `test/arduboy.test.mjs:83` | floor | `200` | `lit > 200` | runtime | **not recorded** |
| `test/arduboy.test.mjs:84` | ceiling | `8000` | `lit < 8000` | runtime | **not recorded** |
| `test/arduboy.test.mjs:94` | floor | `45` | `fps > 45` | runtime | **not recorded** |
| `test/arduboy.test.mjs:94` | ceiling | `75` | `fps < 75` | runtime | **not recorded** |
| `test/arduboy.test.mjs:190` | floor | `100` | `sound.edges > 100` | runtime | **not recorded** |
| `test/arduboy.test.mjs:194` | floor | `100` | `sound.hz > 100` | runtime | **not recorded** |
| `test/arduboy.test.mjs:194` | ceiling | `4000` | `sound.hz < 4000` | runtime | **not recorded** |
| `test/arduboy.test.mjs:203` | floor | `0` | `first.edges > 0` | definitional | **not recorded** |
| `test/arduboy.test.mjs:231` | floor | `0` | `seen.length > 0` | definitional | **not recorded** |
| `test/arduboy.test.mjs:236` | floor | `0` | `led[channel] >= 0` | definitional | **not recorded** |
| `test/arduboy.test.mjs:236` | ceiling | `1` | `led[channel] <= 1` | runtime | **not recorded** |
| `test/arduboy.test.mjs:241` | tolerance | `0.02` | `brightest > 0.02` | runtime | **not recorded** |
| `test/arduboy.test.mjs:241` | tolerance | `0.5` | `brightest < 0.5` | runtime | **not recorded** |
| `test/asm-examples.test.mjs:49` | floor | `0` | `asmExamplesFor(device).length > 0` | definitional | **not recorded** |
| `test/asm-examples.test.mjs:85` | floor | `0` | `out.bytes > 0` | definitional | **not recorded** |
| `test/audio-context-unblock.test.mjs:118` | floor | `3000` | `DECODE_TIMEOUT_MS >= 3000` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:43` | ceiling | `300` | `b.minX < 300` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:43` | floor | `300` | `b.maxX > 300` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:44` | ceiling | `240` | `b.minY < 240` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:44` | floor | `240` | `b.maxY > 240` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:47` | ceiling | `300` | `rotated.minX < 300` | runtime | **not recorded** |
| `test/circuit-hit-test.test.mjs:47` | floor | `300` | `rotated.maxX > 300` | runtime | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | ceiling | `300` | `b.minX < 300` | runtime | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | floor | `300` | `b.maxX > 300` | runtime | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | ceiling | `200` | `b.minY < 200` | runtime | **not recorded** |
| `test/circuit-rendering-regressions.test.mjs:30` | floor | `200` | `b.maxY > 200` | runtime | **not recorded** |
| `test/circuit-tab-index.test.mjs:14` | floor | `0` | `circuitPos > 0` | definitional | **not recorded** |
| `test/compile-cache.test.mjs:67` | floor | `2` | `calls <= 2` | runtime | **not recorded** |
| `test/compile-cache.test.mjs:74` | floor | `1` | `compileCacheLoad().length >= 1` | definitional | **not recorded** |
| `test/condition.test.mjs:120` | floor | `0` | `why.length > 0` | definitional | **not recorded** |
| `test/controller-board-face.test.mjs:29` | tolerance | `39.9` | `breadboardTop - unoBottom >= 39.9` | runtime | **not recorded** |
| `test/controller-integration.test.mjs:108` | floor | `0` | `last.value > 0` | definitional | **not recorded** |
| `test/controller-panel.test.mjs:670` | tolerance | `0.01` | `Math.abs(partCalls[0].value - 128 / 255) < 0.01` | runtime | **not recorded** |
| `test/controller-panel.test.mjs:976` | tolerance | `0.01` | `Math.abs(pinCalls[0].value - 0.75) < 0.01` | runtime | **not recorded** |
| `test/corpus-differential.test.mjs:34` | timeout-ms | `180000` | `timeout: 180_000` | load-sensitive | **not recorded** |
| `test/declared-pins-wired.test.mjs:275` | ceiling | `1` | `unresolved.length <= 1` | countable | **not recorded** |
| `test/declared-pins-wired.test.mjs:310` | tolerance | `0.25` | `withPins.length / ROWS.length >= 0.25` | runtime | **not recorded** |
| `test/declared-pins-wired.test.mjs:313` | tolerance | `0.5` | `withCircuit.length / ROWS.length >= 0.5` | runtime | **not recorded** |
| `test/declared-pins-wired.test.mjs:483` | floor | `0` | `KNOWN_UNWIRED.size > 0` | definitional | **not recorded** |
| `test/declared-pins-wired.test.mjs:483` | floor | `0` | `KNOWN_UNREAD.size > 0` | definitional | **not recorded** |
| `test/device-choice-contract.test.mjs:35` | floor | `15` | `ids.length > 15` | countable | **not recorded** |
| `test/example-execution.test.mjs:300` | floor | `0` | `written.size > 0` | definitional | **not recorded** |
| `test/example-execution.test.mjs:301` | floor | `0` | `read.size > 0` | definitional | **not recorded** |
| `test/example-execution.test.mjs:378` | floor | `0` | `goodTrace.events.length > 0` | definitional | **not recorded** |
| `test/example-rom-autoload.test.mjs:29` | floor | `0` | `anchor > 0` | definitional | **not recorded** |
| `test/example-rom-autoload.test.mjs:35` | floor | `0` | `start > 0` | definitional | **not recorded** |
| `test/example-vm-execution.test.mjs:276` | floor | `20` | `ids.size >= 20` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:296` | floor | `20` | `probe.opcodes.size >= 20` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:338` | floor | `50` | `board.size > 50` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:340` | floor | `0` | `guards.size > 0` | definitional | **not recorded** |
| `test/example-vm-execution.test.mjs:383` | floor | `10` | `addressable.size >= 10` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:430` | floor | `259` | `entries.length >= 259` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:431` | floor | `257` | `withProgram.length >= 257` | countable | **not recorded** |
| `test/example-vm-execution.test.mjs:516` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/example-vm-execution.test.mjs:545` | floor | `0` | `authored.length > 0` | definitional | **not recorded** |
| `test/example-vm-execution.test.mjs:659` | floor | `117` | `report.executed.length >= 117` | evidenced | `defect; expected 117+ (the measurement of 2026-08-23). Either the corpus shrank or ` + |
| `test/faceplate-thermostat.test.mjs:67` | floor | `35` | `io.get('temp') >= 35` | runtime | **not recorded** |
| `test/faceplate-thermostat.test.mjs:79` | ceiling | `35` | `panel.getValue('temp') < 35` | runtime | **not recorded** |
| `test/fetch-pinning.test.mjs:118` | size-cap | `1` | `maxBuffer: 1 << 28` | no-trip | **not recorded** |
| `test/fetch-pinning.test.mjs:358` | floor | `400` | `files.length >= 400` | countable | **not recorded** |
| `test/fetch-pinning.test.mjs:367` | size-cap | `1` | `maxBuffer: 1 << 28` | no-trip | **not recorded** |
| `test/fetch-pinning.test.mjs:392` | floor | `48` | `uses.length >= 48` | countable | **not recorded** |
| `test/fetch-pinning.test.mjs:429` | floor | `80` | `(r.why \|\| '').length > 80` | countable | **not recorded** |
| `test/fetch-pinning.test.mjs:461` | floor | `3` | `names.length >= 3` | countable | **not recorded** |
| `test/gallery-extension-integrity.test.mjs:56` | floor | `0` | `fetched >= 0` | definitional | **not recorded** |
| `test/ios-share-popover.test.mjs:22` | floor | `0` | `anchor >= 0` | definitional | **not recorded** |
| `test/l10n-parity.test.mjs:52` | floor | `0` | `keys.en.size > 0` | definitional | **not recorded** |
| `test/l10n-parity.test.mjs:53` | floor | `0` | `keys.de.size > 0` | definitional | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:152` | floor | `100` | `Math.abs(board.resistance(netId(board, 'vcc1', 'vcc'), netId(board, 'gnd1', 'gnd')) - 235) > 100` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:166` | ceiling | `1000` | `board.resistance(netId(board, 'vcc1', 'vcc'), netId(board, 'gnd1', 'gnd')) < 1000` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:168` | floor | `100000000` | `board.resistance(netId(board, 'btn1', 'a'), netId(board, 'btn1', 'b')) > 1e8` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:170` | floor | `100000000` | `board.resistance(netId(board, 'stc151', 'p0.0'), netId(board, 'stc151', 'p0.1')) > 1e8` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:208` | floor | `2` | `Math.max(...gains) - Math.min(...gains) > 2` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:281` | ceiling | `1` | `(oMax - oMin) < 1.0` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:281` | tolerance | `0.5` | `(oMax - oMin) > 0.5` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:334` | tolerance | `1.5` | `oneTau > 1.5` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave2.test.mjs:398` | floor | `1000000` | `board.resistance(gnd, hot) > 1e6` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:67` | floor | `1` | `r.rows.length >= 1` | definitional | // is the one measured throughout this review. |
| `test/lesson-bench-claims-wave6.test.mjs:157` | floor | `5` | `slowRecordS > 5` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:159` | tolerance | `4.5` | `Math.max(...seen) > 4.5` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:203` | tolerance | `0.9999` | `ratio > 0.9999` | evidenced | `at ${us} us the measured current is ${(ratio * 100).toFixed(4)} % of the ideal RL curve`) |
| `test/lesson-bench-claims-wave6.test.mjs:203` | tolerance | `1.0002` | `ratio < 1.0002` | evidenced | `at ${us} us the measured current is ${(ratio * 100).toFixed(4)} % of the ideal RL curve`) |
| `test/lesson-bench-claims-wave6.test.mjs:250` | tolerance | `0.25` | `iAt1Tau / (0.05 * (1 - Math.exp(-1))) < 0.25` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:289` | tolerance | `81.92` | `periodBelowMs > 81.92` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:293` | tolerance | `81.92` | `1000 / fc < 81.92` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:330` | ceiling | `1` | `secondsPerPoint(fc / 10) < 1` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:436` | floor | `8` | `swept.rows.length >= 8` | evidenced | assert.ok(swept.rows.length >= 8, `${swept.rows.length} points measured`); |
| `test/lesson-bench-claims-wave6.test.mjs:453` | floor | `6` | `String(swept.rows[0].magDb).length > 6` | countable | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:459` | ceiling | `12` | `shown.length <= 12` | countable | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:527` | floor | `0` | `peak.magDb > 0` | definitional | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:623` | floor | `2` | `v / 1 > 2` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave6.test.mjs:630` | floor | `2` | `filters.length >= 2` | countable | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:129` | floor | `100` | `byPin.clock > 100` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:130` | floor | `10` | `byPin.latch > 10` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:131` | floor | `10` | `byPin.data > 10` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:189` | floor | `6` | `edges.length >= 6` | countable | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:207` | floor | `45` | `duty > 45` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:207` | ceiling | `55` | `duty < 55` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:210` | tolerance | `81.92` | `slow.period > 81.92` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:211` | tolerance | `81.92` | `mid.period < 81.92` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:211` | tolerance | `81.92` | `fast.period < 81.92` | runtime | **not recorded** |
| `test/lesson-bench-claims-wave7.test.mjs:367` | floor | `0` | `applyAt > 0` | definitional | **not recorded** |
| `test/lesson-bench-claims.test.mjs:66` | floor | `100` | `registeredKinds().length > 100` | countable | **not recorded** |
| `test/lesson-bench-claims.test.mjs:113` | tolerance | `0.2` | `onA > 0.2` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:113` | tolerance | `0.001` | `offA < 0.001` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:115` | tolerance | `0.001` | `offB < 0.001` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:115` | tolerance | `0.001` | `offB2 < 0.001` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:117` | tolerance | `0.2` | `onC > 0.2` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:117` | tolerance | `0.2` | `onC2 > 0.2` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:129` | tolerance | `0.4` | `b[0] - b[2] > 0.4` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:143` | tolerance | `0.2` | `errorPct > 0.2` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:143` | ceiling | `5` | `errorPct < 5` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:161` | floor | `3` | `Math.abs(supply - (p1 + p2)) > 3` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:186` | tolerance | `4.8` | `volts(board, 'cap', 'a') > 4.8` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:191` | tolerance | `2.5` | `first > 2.5` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:206` | tolerance | `0.001` | `Math.abs(before - after) < 0.001` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:218` | floor | `3` | `edgeBefore - edgeAfter > 3` | runtime | **not recorded** |
| `test/lesson-bench-claims.test.mjs:349` | tolerance | `0.3` | `board.ledBrightness('led1') > 0.3` | runtime | **not recorded** |
| `test/lesson-debugger-surface.test.mjs:97` | floor | `0` | `readFileSync(path.join(EX, rel), 'utf8').length > 0` | definitional | **not recorded** |
| `test/lesson-defect-detector.test.mjs:73` | floor | `1` | `blocking.length >= 1` | definitional | **not recorded** |
| `test/lesson-defect-detector.test.mjs:260` | floor | `180` | `report.checkpoints >= 180` | runtime | **not recorded** |
| `test/lesson-language-matrix.test.mjs:77` | floor | `3` | `source.split('\n').length > 3` | countable | **not recorded** |
| `test/lesson-language-matrix.test.mjs:83` | floor | `0` | `blocks > 0` | definitional | **not recorded** |
| `test/lesson-language-matrix.test.mjs:92` | floor | `40` | `out.length > 40` | countable | **not recorded** |
| `test/lesson-language-matrix.test.mjs:97` | floor | `60` | `variants >= 60` | runtime | **not recorded** |
| `test/lesson-numeric-contract.test.mjs:68` | floor | `40` | `examined >= 40` | runtime | **not recorded** |
| `test/lesson-numeric-contract.test.mjs:69` | floor | `10` | `quoting >= 10` | runtime | **not recorded** |
| `test/lesson-panel-claims-wave4.test.mjs:502` | tolerance | `0.001` | `Math.abs(wiper(0) - 0.0005) < 1e-3` | runtime | **not recorded** |
| `test/lesson-panel-claims-wave4.test.mjs:503` | tolerance | `0.001` | `Math.abs(wiper(0.5) - 2.5) < 1e-3` | runtime | **not recorded** |
| `test/lesson-panel-claims-wave4.test.mjs:504` | tolerance | `0.001` | `Math.abs(wiper(1) - 4.9995) < 1e-3` | runtime | **not recorded** |
| `test/lessons.test.mjs:42` | floor | `8` | `catalog.lessons.length >= 8` | countable | **not recorded** |
| `test/lessons.test.mjs:45` | floor | `0` | `lesson.version > 0` | definitional | **not recorded** |
| `test/lessons.test.mjs:130` | floor | `2` | `lesson.checkpoints.length >= 2` | countable | **not recorded** |
| `test/lessons.test.mjs:136` | floor | `2` | `diodeLesson.version >= 2` | runtime | **not recorded** |
| `test/lessons.test.mjs:147` | floor | `2` | `capacitorLesson.version >= 2` | runtime | **not recorded** |
| `test/machine-media-order.test.mjs:14` | floor | `0` | `start >= 0` | definitional | **not recorded** |
| `test/machine-runner-board.test.mjs:13` | floor | `0` | `start >= 0` | definitional | **not recorded** |
| `test/makecode-arcade-runs.test.mjs:49` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/makecode-arcade-runs.test.mjs:50` | floor | `40` | `run.blockCount > 40` | runtime | **not recorded** |
| `test/makecode-arcade-runs.test.mjs:52` | floor | `0` | `run.variablesChanged > 0` | definitional | **not recorded** |
| `test/makecode-arcade-runs.test.mjs:64` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/makecode-arcade-runs.test.mjs:73` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/makecode-arcade.test.mjs:71` | floor | `2` | `names.length >= 2` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:153` | floor | `5` | `out.unsupported.length > 5` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:155` | floor | `10` | `u.length > 10` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:197` | floor | `2` | `Object.keys(maps).length >= 2` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:203` | floor | `4` | `level.tiles.length >= 4` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:231` | floor | `10000` | `backdrop.svg.length > 10000` | countable | **not recorded** |
| `test/makecode-arcade.test.mjs:300` | floor | `10` | `hero.length > 10` | countable | **not recorded** |
| `test/makecode-calliope.test.mjs:193` | floor | `0` | `files.length > 0` | definitional | **not recorded** |
| `test/makecode-export.test.mjs:287` | floor | `0` | `files.length > 0` | definitional | **not recorded** |
| `test/makecode-import.test.mjs:118` | floor | `256` | `bin.buf.length >= 256` | countable | **not recorded** |
| `test/makecode-import.test.mjs:253` | floor | `100` | `res.files['main.ts'].length > 100` | countable | **not recorded** |
| `test/makecode-import.test.mjs:262` | floor | `2` | `res.costumes.length >= 2` | countable | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:46` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:49` | floor | `0` | `run.calls.get('microbitplus_analogread') > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:69` | floor | `0` | `run.extensionCalls > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:86` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:91` | floor | `0` | `run.extensionCalls > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:110` | floor | `0` | `run.calls.get('bitops_and') > 0` | definitional | **not recorded** |
| `test/makecode-microbit-runs.test.mjs:111` | floor | `0` | `run.calls.get('bitops_shl') > 0` | definitional | **not recorded** |
| `test/makecode-nothing-vanishes.test.mjs:93` | floor | `3` | `files.length >= 3` | countable | **not recorded** |
| `test/makecode-nothing-vanishes.test.mjs:115` | floor | `3` | `files.length >= 3` | countable | **not recorded** |
| `test/makecode-nothing-vanishes.test.mjs:139` | floor | `0` | `vanished.size > 0` | definitional | **not recorded** |
| `test/makecode-ui-contract.test.mjs:126` | floor | `5` | `literals.length >= 5` | countable | **not recorded** |
| `test/makecode-ui-contract.test.mjs:136` | floor | `0` | `start > 0` | definitional | **not recorded** |
| `test/makecode-ui-contract.test.mjs:143` | floor | `12` | `keys.length >= 12` | countable | **not recorded** |
| `test/microbit-pins-drive-circuit.test.mjs:194` | tolerance | `0.1` | `brightness > 0.1` | runtime | **not recorded** |
| `test/microbit-pins-drive-circuit.test.mjs:199` | floor | `4` | `mA > 4` | runtime | **not recorded** |
| `test/microbit-pins-drive-circuit.test.mjs:199` | tolerance | `6.5` | `mA < 6.5` | runtime | **not recorded** |
| `test/native-bluetooth.test.mjs:602` | ceiling | `8000` | `elapsed < 8000` | runtime | **not recorded** |
| `test/no-dead-overlay-modules.test.mjs:225` | floor | `20` | `reason.length > 20` | countable | **not recorded** |
| `test/no-dead-overlay-modules.test.mjs:229` | floor | `20` | `reason.length > 20` | countable | **not recorded** |
| `test/overlay-packages-pairs.test.mjs:19` | size-cap | `1` | `maxBuffer: 1 << 28` | no-trip | **not recorded** |
| `test/pane-divider-math.test.mjs:115` | floor | `0` | `half > 0` | definitional | **not recorded** |
| `test/pane-divider-math.test.mjs:115` | ceiling | `1` | `half < 1` | runtime | **not recorded** |
| `test/pane-divider-math.test.mjs:125` | floor | `0` | `got > 0` | definitional | **not recorded** |
| `test/pane-divider-math.test.mjs:125` | ceiling | `1` | `got < 1` | runtime | **not recorded** |
| `test/project-bundle-roundtrip.test.mjs:70` | floor | `0` | `project.targets.length > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:55` | floor | `0` | `source.length > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:162` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:167` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:173` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:321` | floor | `0` | `Number(value('ballVY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:329` | floor | `2` | `Number(value('ballVX').value) > 2` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:330` | floor | `0` | `Number(value('ballVY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:407` | floor | `0` | `Number(value('ballVY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:503` | floor | `9` | `Number(value('pushes').value) >= 9` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:838` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1202` | floor | `0` | `Number(value('mineStun').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1589` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1612` | floor | `0` | `Number(value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1626` | floor | `0` | `Number(stageValue(relay, 'overdrive').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1680` | floor | `0` | `Number(value(rift, 'ly').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1681` | floor | `0` | `Number(value(rift, 'ry').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1696` | ceiling | `0` | `Number(value(circuit, 'lane').value) < 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1712` | floor | `70` | `Number(value(circuit, 'fuel').value) > 70` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1833` | floor | `0` | `Number(value(pantry, 'alert').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1841` | floor | `80` | `distance(cheese, tunnel) > 80` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1842` | floor | `70` | `distance(cheese, cat) > 70` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:1968` | ceiling | `100` | `Number(value(tidegate, 'charge').value) < 100` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2011` | floor | `0` | `Number(value(rink, 'vy').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2012` | floor | `0` | `Number(value(rink, 'skaterY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2038` | floor | `2` | `Number(value(hoops, 'charge').value) > 2` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2078` | floor | `43` | `Number(value(comet, 'matchTime').value) >= 43` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2084` | floor | `0` | `Number(value(comet, 'strikerY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2331` | floor | `0` | `Number(value(halo, 'shieldAngle').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2355` | floor | `0` | `Number(value(kestrel, 'driftX').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2356` | floor | `0` | `Number(value(kestrel, 'driftY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2358` | floor | `0` | `Number(value(kestrel, 'droneY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2489` | floor | `0` | `value(coil, 'trailX').value.length > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2512` | floor | `0` | `Number(value(lift, 'flyerVY').value) > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2543` | floor | `1` | `targets.length >= 1` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2544` | floor | `70` | `blocks.length >= 70` | countable | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2654` | floor | `70` | `run.blockCount >= 70` | runtime | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2655` | floor | `0` | `run.threadsStarted > 0` | definitional | **not recorded** |
| `test/pseudocode-game-examples.test.mjs:2657` | floor | `0` | `run.variablesChanged > 0` | definitional | **not recorded** |
| `test/remote-extension-sandbox.test.mjs:34` | floor | `0` | `bytes >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:44` | floor | `256` | `view.getUint16(0x14, true) > 0x100` | runtime | **not recorded** |
| `test/rp2040-bootrom.test.mjs:45` | floor | `256` | `view.getUint16(0x18, true) > 0x100` | runtime | **not recorded** |
| `test/rp2040-bootrom.test.mjs:47` | floor | `0` | `view.getUint32(0x04, true) > 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:65` | floor | `4` | `entries >= 4` | countable | **not recorded** |
| `test/rp2040-bootrom.test.mjs:92` | floor | `0` | `run(lookup, {0: table, 1: ROM_FUNC.MEMCPY}) >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:94` | floor | `256` | `found > 0x100` | runtime | **not recorded** |
| `test/rp2040-bootrom.test.mjs:97` | floor | `0` | `run(lookup, {0: table, 1: 0x5A5A}) >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:113` | floor | `0` | `steps >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:131` | floor | `0` | `run(memcpy, {0: dst, 1: 0x20002000, 2: 0}) >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:144` | floor | `0` | `steps >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:157` | floor | `256` | `fn > 0x100` | runtime | **not recorded** |
| `test/rp2040-bootrom.test.mjs:160` | floor | `0` | `steps >= 0` | definitional | **not recorded** |
| `test/rp2040-bootrom.test.mjs:217` | floor | `256` | `lookup > 0x100` | runtime | **not recorded** |
| `test/rp2040-debug.test.mjs:45` | floor | `1` | `handle >= 1` | definitional | **not recorded** |
| `test/sb3-creator-motion-target.test.mjs:13` | floor | `0` | `allBlocks.length > 0` | definitional | **not recorded** |
| `test/schematic-projection.test.mjs:68` | ceiling | `1200` | `projected.height < 1200` | runtime | **not recorded** |
| `test/schematic-projection.test.mjs:69` | floor | `500` | `projected.width > 500` | runtime | **not recorded** |
| `test/scratchlink-protocol-parity.test.mjs:164` | floor | `0` | `start >= 0` | definitional | **not recorded** |
| `test/scratchlink-transport.test.mjs:42` | floor | `3` | `t.label.length > 3` | countable | **not recorded** |
| `test/scratchlink-transport.test.mjs:43` | floor | `20` | `t.detail.length > 20` | countable | **not recorded** |
| `test/simulator-driver-controls-respond.test.mjs:246` | floor | `33` | `benches >= 33` | runtime | **not recorded** |
| `test/simulator-driver-controls-respond.test.mjs:247` | floor | `67` | `pins >= 67` | runtime | **not recorded** |
| `test/stale-build-recovery.test.mjs:31` | floor | `0` | `start > 0` | definitional | **not recorded** |
| `test/stale-build-recovery.test.mjs:35` | floor | `0` | `open > 0` | definitional | **not recorded** |
| `test/stale-build-recovery.test.mjs:132` | floor | `0` | `state.cachesDeleted > 0` | definitional | **not recorded** |
| `test/tab-index-contract.test.mjs:84` | floor | `4` | `panelCount >= 4` | runtime | **not recorded** |
| `test/upstream-selectors.test.mjs:82` | floor | `30` | `r.why.length > 30` | countable | **not recorded** |
| `test/upstream-selectors.test.mjs:100` | floor | `0` | `used.length > 0` | definitional | **not recorded** |
| `test/wait-census.test.mjs:41` | size-cap | `1` | `maxBuffer: 1 << 26` | no-trip | **not recorded** |
| `test/wait-census.test.mjs:77` | floor | `100` | `c.census.parsed >= 100` | runtime | **not recorded** |
| `test/wait-census.test.mjs:80` | floor | `100` | `c.census.bounds.length >= 100` | evidenced | `only ${c.census.bounds.length} bounding literals found; expected ~119. The Property ` |
| `test/wait-census.test.mjs:83` | floor | `0` | `ciSleeps.length > 0` | definitional | **not recorded** |
| `test/wave-open-defects.test.mjs:45` | floor | `30` | `rows.length >= 30` | countable | **not recorded** |
| `test/wave-open-defects.test.mjs:175` | floor | `0` | `nonField.size > 0` | definitional | **not recorded** |
| `test/wave-open-defects.test.mjs:241` | floor | `6` | `offered.length >= 6` | countable | **not recorded** |
| `test/wave-open-defects.test.mjs:285` | floor | `0` | `sites.length > 0` | definitional | **not recorded** |
| `test/helpers/timed.mjs:178` | timeout-ms | `30000` | `timeout: 30_000` | load-sensitive | **not recorded** |
| `test/helpers/timed.mjs:402` | floor | `0` | `budgetMs <= 0` | definitional | **not recorded** |
| `scripts/_tmp-eyes.mjs:10` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-eyes.mjs:11` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:11` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:12` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-lcd-probe.mjs:18` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:12` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:13` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:16` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-machine-probe.mjs:19` | timeout-ms | `6000` | `timeout: 6000` | load-sensitive | **not recorded** |
| `scripts/_tmp-paint-test.mjs:7` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-paint-test.mjs:8` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:12` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:13` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:16` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:20` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-pendant-stale.mjs:22` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:16` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:17` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:20` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:23` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/_tmp-preset-probe.mjs:31` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/_tmp-rightpane.mjs:10` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-rightpane.mjs:11` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-rightpane.mjs:17` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:9` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:10` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-sweep-probe.mjs:13` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:43` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:44` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:48` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:51` | timeout-ms | `6000` | `timeout: 6000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-asm-probe.mjs:72` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:21` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:22` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:25` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:30` | timeout-ms | `6000` | `timeout: 6000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:34` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:39` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:52` | timeout-ms | `6000` | `timeout: 6000` | load-sensitive | **not recorded** |
| `scripts/_tmp-vdp-probe.mjs:59` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/aggregate-timeouts.mjs:118` | floor | `50` | `parsed < 50` | runtime | **not recorded** |
| `scripts/gen-rust-notices.mjs:17` | size-cap | `67108864` | `maxBuffer: 1024 * 1024 * 64` | no-trip | **not recorded** |
| `scripts/lib-code-actions.mjs:26` | timeout-ms | `30000` | `timeout = 30000` | load-sensitive | **not recorded** |
| `scripts/make-ios-icons.mjs:140` | size-cap | `1` | `maxBuffer: 1 << 28` | no-trip | **not recorded** |
| `scripts/oracle-simavr.mjs:42` | size-cap | `4194304` | `maxBuffer: 4 * 1024 * 1024` | no-trip | **not recorded** |
| `scripts/probe-layout.mjs:89` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/probe-layout.mjs:98` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/probe-layout.mjs:120` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/probe-microbit-resume.mjs:85` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `scripts/proof-production.mjs:79` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-about-dialog.mjs:49` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-arduboy.mjs:103` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/verify-arduboy.mjs:104` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-arduboy.mjs:109` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-arduboy.mjs:120` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:40` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:41` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:65` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:77` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:116` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:127` | timeout-ms | `30000` | `timeout: Number(process.env.AURORA_BOOT_TIMEOUT \|\| 30000)` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:130` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:131` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-aurora65-workstation.mjs:146` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-basic-run.mjs:25` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-bluetooth.mjs:85` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-chrome-sweep.mjs:31` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:20` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:21` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:29` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:61` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:94` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:102` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:121` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:134` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-rendering.mjs:155` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:53` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:54` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:92` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:194` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:201` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-circuit-ux.mjs:257` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:25` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:29` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:98` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:126` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:221` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-controller-panel.mjs:232` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:135` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:136` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:195` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:196` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:201` | timeout-ms | `4000` | `timeout: 4000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:209` | timeout-ms | `5000` | `timeout: 5000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:212` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-debug-dock.mjs:214` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-debugger-solo.mjs:65` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-debugger-solo.mjs:66` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-debugger-solo.mjs:84` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/verify-editor.mjs:35` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:29` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:30` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:42` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:46` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:66` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:75` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:80` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:98` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:101` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-example-selector.mjs:117` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-extension-sandbox.mjs:14` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-blinkenrocket.mjs:87` | ceiling | `32` | `scr.config.rows * scr.config.cols <= 32` | runtime | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:52` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:60` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:96` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:107` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:121` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:128` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:135` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:204` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:209` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-faceplate-matrix.mjs:220` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:39` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:40` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:44` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-instruments-scroll.mjs:78` | floor | `0` | `after.scrollTop <= 0` | definitional | **not recorded** |
| `scripts/verify-interaction.mjs:55` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-interaction.mjs:56` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-interaction.mjs:61` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `scripts/verify-interaction.mjs:62` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `scripts/verify-interaction.mjs:213` | ceiling | `20` | `zoomShift <= 20` | runtime | **not recorded** |
| `scripts/verify-intro.mjs:30` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:92` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:93` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:101` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:116` | timeout-ms | `8000` | `timeout: 8000` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:120` | timeout-ms | `2500` | `timeout: 2500` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:152` | timeout-ms | `2500` | `timeout: 2500` | load-sensitive | **not recorded** |
| `scripts/verify-labwired-engine.mjs:192` | timeout-ms | `3000` | `timeout: 3000` | load-sensitive | **not recorded** |
| `scripts/verify-makecode.mjs:109` | timeout-ms | `90000` | `timeout: 90000` | load-sensitive | **not recorded** |
| `scripts/verify-makecode.mjs:110` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-makecode.mjs:115` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:67` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:78` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:109` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:226` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:250` | timeout-ms | `25000` | `timeout: 25000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:274` | timeout-ms | `20000` | `timeout: 20000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:282` | timeout-ms | `25000` | `timeout: 25000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:314` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit-debug-toggle.mjs:319` | timeout-ms | `15000` | `timeout: 15000` | load-sensitive | **not recorded** |
| `scripts/verify-microbit.mjs:42` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-schematic.mjs:48` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-schematic.mjs:49` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-schematic.mjs:56` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `scripts/verify-schematic.mjs:60` | timeout-ms | `2000` | `timeout: 2000` | load-sensitive | **not recorded** |
| `scripts/verify-starter-journeys.mjs:17` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-starter-journeys.mjs:49` | timeout-ms | `45000` | `timeout: 45000` | load-sensitive | **not recorded** |
| `scripts/verify-starter-journeys.mjs:60` | timeout-ms | `30000` | `timeout: 30000` | load-sensitive | **not recorded** |
| `scripts/verify-starter-journeys.mjs:64` | timeout-ms | `45000` | `timeout: 45000` | load-sensitive | **not recorded** |
| `scripts/verify-starter-journeys.mjs:66` | timeout-ms | `10000` | `timeout: 10000` | load-sensitive | **not recorded** |
| `scripts/verify-view-buttons.mjs:33` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `scripts/verify-view-buttons.mjs:41` | timeout-ms | `60000` | `timeout: 60000` | load-sensitive | **not recorded** |
| `.github/workflows/build.yml:60` | timeout-min | `30` | `job/step timeout` | load-sensitive | **not recorded** |
| `.github/workflows/build.yml:354` | size-cap | `2560` | `node heap cap` | no-trip | **not recorded** |
| `.github/workflows/build.yml:261` | ceiling | `0` | `ceiling KNOWN_INERT` | definitional | **not recorded** |
| `.github/workflows/build.yml:261` | ceiling | `0` | `ceiling KNOWN_SHADOWED_WRITES` | definitional | **not recorded** |
| `.github/workflows/build.yml:261` | ceiling | `0` | `ceiling KNOWN_NO_BLOCKS` | definitional | **not recorded** |
| `.github/workflows/build.yml:261` | ceiling | `2` | `ceiling TIME_GATED` | runtime | **not recorded** |
| `.github/workflows/deploy-daily.yml:22` | timeout-min | `30` | `job/step timeout` | load-sensitive | **not recorded** |
| `.github/workflows/deploy-daily.yml:35` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/mobile.yml:26` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/mobile.yml:42` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/mobile.yml:123` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/mobile.yml:233` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/release.yml:20` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/release.yml:42` | pin | `22` | `node-version` | no-trip | **not recorded** |
| `.github/workflows/vendor-freshness.yml:69` | size-cap | `0` | `checkout fetch-depth` | no-trip | **not recorded** |
| `.github/workflows/vendor-freshness.yml:74` | size-cap | `0` | `checkout fetch-depth` | no-trip | **not recorded** |
| `.github/workflows/vendor-freshness.yml:79` | size-cap | `0` | `checkout fetch-depth` | no-trip | **not recorded** |
| `.github/workflows/vendor-freshness.yml:93` | pin | `22` | `node-version` | no-trip | **not recorded** |
