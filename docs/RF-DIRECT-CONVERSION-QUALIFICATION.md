# Direct-conversion whistle: physical qualification

Status: the upstream repair passed its applicable hosted jobs and merged in
[bw-board #782](https://github.com/CrispStrobe/bw-board/pull/782) as
`b47e7e09ed873b33ca2fd912b21e136decc5e677`; this exact revision is now the
supplier fixture. The first full supplier hosted run passed the settled
direct-conversion case and WebGL renderer checks, but failed the threshold
evidence ratchet and a separate Meissner squegging scenario. The ratchet has
a comment-only repair; the squegging behavior still blocks supplier
qualification. The measured candidate was
`6b9e281ca0104ebccacca6d8020295fe18ceb929`, based on master
`d21d6d8b819263eb08231134b7556efa82289a90`. Candidate and merged revision have
the identical complete tree `29c2df9fdbf2b6998e44f41e01599aebdc9a1ec6`.
The CUI fixture remains `ee2b4127a88f1b308f8d749cae4d7c1db1deae9e`.

## Why the historical number was rejected

The old test sampled the loudspeaker from 2–5 ms after power-on and counted
crossings around one window-wide mean. Board `b094eb22` reproduced roughly
5853 Hz by that method, close to the recorded 5833 Hz. However, this was not
a stationary difference tone: the mixer current crossed about 16388 Hz,
the RF phase-line residual was 12.84 radians RMS, and the transmitter's base
was at -31.8 V at 5 ms. A crossing count from that transient cannot establish
the frequency of two steady RF oscillators.

The later fixture `de8083c5a894a49c9fa4c6f0fb6f8866e2d758c0` reproduced the
reported 1170.56856 Hz result. Its receiver LO burst to volts and then
collapsed to microvolts while the transmitted RF persisted. Moving the
observation window alone did not repair it; the 5–8 ms trace was also
nonstationary.

The earlier recorded speaker counts are retained here as **nonqualifying
historical evidence**: 5833 Hz as authored, 7167 Hz at transmitter tuning
0.302, and 1167 Hz on 6 V (2026-11-25, Board `b094eb22`). The still earlier
3846/1171/5518 Hz counts preceded the radiator correction in Board #755.
None of these transient counts is silently relabelled as a settled beat.

## Engine defects and independent controls

Board's old consistency correction scaled every nonlinear port with one
scalar and checked only their combined norm. An unrelated decaying channel
could therefore move an exact 50 mV equilibrium to 38.028 mV. The repair
gives each nonlinear device its own mode scale, retains its coupled junction
ports together, and checks interaction between devices without dropping weak
physical coupling. It preserves the reviewed isolated-device arithmetic.

An initial per-port vector experiment was rejected because it constrained
the individual base-emitter swing when collector limiting needed the coupled
device's mode to change. A later inner/outer precision mismatch was also
found: an insufficiently resolved inner root falsely failed the coupled
outer check, causing repeated backward-Euler restarts and detector jitter.
The final candidate resolves coupled inner roots more accurately while
preserving outer convergence bounds and all physical/performance thresholds.

Seven independent equation controls cover disconnected equilibria, separate
changing channels, nonlinear capacitance history, phase/order invariance,
out-of-range roots, passive coupling, and a coupled multiport/scalar device
pair. All seven and all 65 existing RF cases pass, including headroom,
quench, 1-ulp stability, exact isolated-device trajectory, VHF continuity and
the keyed-transmitter cost guard.

## Reference separate from the changed correction

The reference disables the consistency correction and bounds RF substeps
at 128 ns and 64 ns. It uses the same authored circuit and the application's
official `injectEngine()` boundary. The source equations and explicit branch
are unchanged by the device-mode repair. Halving the maximum step gives the
following phase-difference frequencies after settling:

| Condition | 128 ns reference | 64 ns reference | Difference |
| --- | ---: | ---: | ---: |
| 9 V, both tunings 0.3 | 3862.159 Hz | 3862.206 Hz | 0.047 Hz |
| 9 V, transmitter tuning 0.302 | 6200.686 Hz | 6200.816 Hz | 0.130 Hz |
| 6 V, both tunings 0.3 | 4947.544 Hz | 4947.621 Hz | 0.077 Hz |

The values above use the slope of unwrapped `arg(RF × conjugate(LO))`.
That phase difference is independent of the common band centre and of the
speaker's DC offset. These reference traces have phase-line residuals below
0.00002 radians RMS. The opposite small tuning change, 0.298, gives about
1495.2 Hz in the 128 ns reference, confirming the direction independently.
Only the three cases in the table have the two-step convergence comparison;
the opposite small-tuning control has a 128 ns reference alone.

The repaired production engine gives:

| Condition | Carrier phase beat | Mixer output periods | Speaker periods |
| --- | ---: | ---: | ---: |
| 9 V, tuning 0.3 | 3862.31 Hz | 3862.32 Hz | 3862.94 Hz |
| Transmitter tuning 0.302 | 6199.12 Hz | 6198.15 Hz | 6199.14 Hz |
| 6 V transmitter | 4945.24 Hz | 4946.24 Hz | 4947.65 Hz |
| Transmitter tuning 0.298 | 1501.21 Hz | 1501.81 Hz | 1502.04 Hz |

The phase residual is 0.006–0.016 radians RMS. RF input amplitudes remain
142.2–143.3 mV across the 9 V conditions and 95.5–95.7 mV at 6 V; LO amplitude
remains about 5.78–5.80 V. This is a steady carrier difference rather than bursts or a
startup crossing count.

The production RF source hashes used for these measurements are:

- `src/radio.js`: `375a293c88a1444ebb5b0b6975617fb2f5c45b616d626091b6cd5e15fc7a5874`
- `src/rf-bands.js`: `cbd8e11bcc1b8c037ab97f5ed323604b920d38c145778b9206cc6e3feab3819f`

The retained samples are in
[`test/measurements/rf-direct-conversion-2026-11-27.json`](../test/measurements/rf-direct-conversion-2026-11-27.json).
Records preserve the HEAD and source hashes at measurement time. The final
production traces were measured before the identical source was published
as `6b9e281`; their source hashes above establish that equivalence. Missing
historical observations are `null`, not measured zeros.

## Settling, observation and negative controls

The mixer-to-amplifier coupling is 100 nF into 10 kΩ, a 1 ms time constant.
The speaker coupling is 220 µF into 8 Ω, a 1.76 ms time constant. The LM386
is still recovering from initial saturation at 2 ms. The revised scenario
waits 8 ms and measures 3 ms at 10 µs intervals. It reads existing complex
port history without advancing the RF integrator, checks both carriers'
amplitude stability, and compares their phase difference with complete
interpolated periods in the actual mixer output and speaker waveform.

The fine references support tighter bounds: carrier phase within 25 Hz of
the independent reference and measured mixer/speaker tones within 20 Hz of
that phase beat. The former 600 Hz window is not widened. Phase-line
residual, period jitter and enough complete cycles also have to pass, so an
amplifier that only recovers near the end cannot supply a false pass.

Removing only the 2.2 pF transmitter-to-mixer coupling capacitor leaves both
oscillators running (transmitter junction swing about 9 V and LO about
5.79 V), but removes the received RF. Mixer output changes by only about
0.22 mV across the observation window. The remaining speaker voltage is a
monotone coupling-capacitor recovery, with no complete periodic tone.
The opposite small tuning change provides a separate directional control.

The lower transmitter supply moves **this modelled circuit's** RF carrier
further below its LO, so the beat rises from about 3.86 to 4.95 kHz. The
historical claim that it necessarily moves toward the LO was based on the
invalid transient measurement. Supply sensitivity is still demonstrated;
its direction is established by the two converged references.

## Candidate checks

On Node 24.22.3, the complete supplier r7mix scenario file and the analytic
metric controls pass together: 10 tests, zero failures. The run used exact
Board `6b9e281` and CUI `ee2b4127`; its elapsed time was 553.2 seconds,
including 493.2 seconds for the five direct-conversion conditions. The
unchanged `de8083c5` fixture fails the new active-carrier assertion, providing
a regression refusal against the observed broken behavior.

Independent review verified that querying retained RF history leaves node
voltages, integration state and step counters unchanged. All 300 samples in
each production condition select the same dominant band; the largest
adjacent phase increment in the qualified cases is 0.394 radians, below the
π unwrapping ambiguity. Short analytic tests reject wrong-frequency audio,
drifting carrier phase, and flat saturated output.

Before pin adoption, the complete authored-physics, EXPECTED-quantity,
circuit-roundtrip and corpus-contract files also passed on the clean candidate:
2,237 tests passed, zero failed, and 43 existing explicit skips remained.
The skips are 42 unsupported assertion forms and one unwired current assertion.
All 2,876 circuit files preserved their canonical load/save/load and electrical
reload behavior. Claim coverage, explained declines, mismatch/exception
ratchets and provenance counts passed. This run retained the old declared pin
in the provenance blocks; those blocks are regenerated by the official
stamping command when adopting the identical merged tree. Full supplier CI
at the new declared pin remains the release gate.

## First hosted supplier run and remaining blocker

[Run 46023428657](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657)
tested supplier `8c9a7aacbed998a07d5c44b44d0f2dd25f4c6432` on Node 22 with the
exact merged Board fixture `b47e7e09` and unchanged CUI fixture `ee2b4127`.
The four test shards completed without timeouts or cancelled tests:

| Job | Passed | Failed | Skipped | Test duration |
| --- | ---: | ---: | ---: | ---: |
| [Shard 1](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657/job/140588601183) | 2,025 | 1 | 48 | 623.1 s |
| [Shard 2](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657/job/140588601166) | 4,110 | 0 | 81 | 1,041.8 s |
| [Shard 3](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657/job/140588601157) | 2,135 | 1 | 15 | 792.9 s |
| [Shard 4](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657/job/140588600668) | 8,078 | 0 | 624 | 914.8 s |
| [WebGL renderer](https://github.com/CrispStrobe/sb3-creator/actions/runs/46023428657/job/140588601099) | 11 | 0 | 0 | 24.0 s |

All seven r7mix scenarios ran and passed on shard 4. The settled
direct-conversion scenario took 436.0 seconds; its complete scenario file
took 518.4 seconds, within the unchanged 900-second per-file budget. The
624 shard-4 skips are accounted for separately: 576 program/compiler checks
across 72 circuit-only examples without a program, 22 gallery entries
without a circuit, 17 checks requiring avr-gcc, eight requiring the external
emu8051-stc build, and one requiring cl65. The gallery skip guards are
unchanged from main `cda7931`; none of the seven RF scenarios was skipped.

Shard 3's only failure counted 36 bounding literals without adjacent evidence
against the existing ceiling of 21. Fifteen newly introduced literals were
in the RF scenario, analytic metric test, observation helper and diagnostic
probe. Their retained measurements or mathematical/architectural basis are
now recorded next to the relevant bounds in checkpoint
`8f3763a6243b508c8b851df0ff78681da7e7bfd2`. Acorn 8.15.0 verified that both
the normalized executable syntax tree and exact executable token stream of
each of those four files are identical to `8c9a7aac`. The focused ratchet and
analytic metric checks pass 8/8 in 0.816 seconds on Node 24.22.3; ESLint and
whitespace checks also pass. The owed count returns to the same historical
21. Every executable value, assertion, tolerance, fixture pin, circuit,
measurement sample and ratchet ceiling is preserved. The retained measurement
file still has SHA-256
`26ed9cbd1501813f3584529c60ed4620c493f3ed9722ee385989cb4a3607ec7a`.

Shard 1's only failure is a separate, still-unresolved physical scenario:
`lab-meissner-squegg` in `test/lab-circuits-r7b.test.mjs`. Its large emitter
bypass is expected to extinguish the RF between bursts; the adopted engine
instead measures a minimum of 8.897128 V against the unchanged 0.01 V quiet
bound. The small-bypass steady-state and reversed-winding controls agree
with the prior engine. A scoped local reproduction gives the same failure
on `b47e7e09`, while both `de8083c5` and prior master `d21d6d8` pass the
untouched scenario. This behavior requires independent physical diagnosis;
the historical 819 Hz tone is not sufficient reason to restore the old
global consistency correction. No squegging assertion has been relaxed.

The subsequent independent references disable that correction entirely and
bound RF substeps more finely. In the identical 6–9 ms observation window,
16 ns gives a steady RF range of 8.898729–8.904473 V and 8 ns gives
8.897855–8.904867 V. Both report no tone; detector spans are respectively
0.265 mV and 0.166 mV. They agree with the adopted engine's steady behavior
in that window, but refine only the inner RF step: the outer/DC transient
solver retains its default adaptive profile. They therefore do **not**
establish convergence of the fully coupled RF/DC trajectory or prove that
the physical circuit is steady. Coarser 128 ns and 32 ns
references burst without converging; the 64 ns run refuses a runaway near
7.896 ms. Those results remain explicitly nonqualifying evidence.

A runtime-only restoration of the old global port partition reproduces the
historical 819.4105 Hz result exactly. A shadow comparison of the same frozen
integration step explains the difference: while the receiver grows, the old
shared norm rejects a valid transistor correction and introduces an extra
26.8 mV transistor dip. The new transistor end remains within its own
start-to-explicit bracket; the receiver changes by only 14.2 microvolts
through retained physical coupling. An independent pair of monotone
nonlinear RC equations reproduces that shared-norm rejection without relying
on this circuit's output. This demonstrates a defect in the old shared-norm
correction; it does not by itself settle the full circuit's coupled behavior.
Neither a replacement circuit nor a wider operating range is qualified.

A subsequent diagnostic of the **unchanged authored circuit**, keeping the
production RF correction and using the public outer-step cap of 1 microsecond,
does produce RF extinction and bursts: 1.603 mV–9.621 V over 6–9 ms, with
2.342–4.379 V at the receiver detector and a provisional 2767 Hz earphone
estimate. It completes without a solver failure. This material change means
the coupled RF/DC feedback and outer-step convergence must be investigated;
the inner-only steady traces cannot justify changing the lesson or dropping
its quiet assertion. The subsequent outer refinements and their remaining
failure are recorded below. The 1-microsecond diagnostic is not a repaired
production path or a new oracle.

The immutable original-circuit diagnosis, including all failed/coarse traces,
the 16/8 ns references, the legacy comparison, equation witness and runtime-only
negative diagnostics, is retained in
[`test/measurements/rf-meissner-squegg-original-2026-11-27.json`](../test/measurements/rf-meissner-squegg-original-2026-11-27.json).
It includes the diagnostic source text and hashes. No in-memory parameter
experiment in that record is a qualified authored-circuit replacement.
The next physical correction must demonstrate real off-periods and a tone,
retain the small-bypass steady and reversed-winding silent controls, and pass
independent fine-step checks. The existing quiet assertion remains intact.

The shard-1 failure also prevented its later gallery-device, mutation-proof
and build steps from running. A fresh complete hosted run, including those
steps and WebGL, remains required after the physical blocker is resolved.
The successful direct-conversion measurements above do not qualify the
separate Meissner case or the supplier as a whole.

## Coupled RF/DC investigation: qualification remains open

The original 16/8 ns observations refine **only the inner RF integrator**.
They leave the default outer/DC solver and its accepted-bias coupling in
place. The later outer-step experiments materially change the original
circuit's behavior, so the earlier steady traces do not establish a steady
physical solution. The original receipt is preserved byte-for-byte, with
SHA-256 `1bb56763ef95923419dda2ddfcab0c84df8702f24bc000b39ae38881ba1ab006`;
this section corrects its interpretation without rewriting its observations.

The following runs keep the authored circuit, production RF correction and
all solver budgets unchanged. They use the public
`configureTransientAnalysis('interactive-v2', { maxStepSec })` API and observe
the same 150 samples over 6–9 ms. The earphone numbers are diagnostic
estimates, not accepted frequency oracles.

| Maximum outer step | RF minimum–maximum | Detector minimum–maximum | Earphone estimate | Result |
| --- | ---: | ---: | ---: | --- |
| 1 µs | 1.603 mV–9.621 V | 2.342–4.379 V | 2767.45 Hz | Extinction and bursts |
| 500 ns | 3.208 mV–9.584 V | 2.377–4.271 V | 2936.87 Hz | Extinction and bursts |
| 250 ns | 1.600 mV–9.657 V | 2.335–4.273 V | 2804.11 Hz | Extinction and bursts |
| 125 ns | 2.439 mV–9.668 V | 2.349–4.301 V | 2723.14 Hz | Extinction and bursts |
| 62.5 ns | No observation samples | No observation samples | None | RF runaway at 0.2871 ms, about 228 kV |

The 125/62.5 ns probes split warmup calls into at most 0.5 ms advances and
record that call schedule. No attempt or RF-substep ceiling was raised.
The failed finer run prevents an outer-convergence claim. Furthermore, all
of these runs retain the adaptive inner RF grid and its Catmull–Rom
observation look-ahead. Refining the outer step alone does not eliminate
that approximation. A fully coupled reference must resolve both levels;
neither the historical 819 Hz result nor any entry in this table is a
replacement target.

Read-only instrumentation of the original circuit identifies a concrete
history-contract mismatch on Board `b47e7e09`. After a DC step is accepted,
`RadioFrontEnd.onAccepted()` changes the operating bias. Its comment says to
discard future RF history integrated under the old bias, but `RfBand.prune()`
removes old past entries and retains the future tail and its integration
state. At one accepted time of 368.418 µs, RF state is still at 438.524 µs,
70.106 µs ahead. The existing inner loop step is about 1.024 µs in that
startup trace. Later accepted bias updates can therefore reuse RF state
integrated tens of microseconds ahead with an earlier bias. The instrumented
default startup uses 1,798 solves over 2 ms; a public 1 µs outer cap uses
9,766. A fixed cap is a diagnostic, not the proposed production repair.
The upstream repair is investigating bounded future-history invalidation
with analytic history controls. No evolving repair prototype is included in
this checkpoint or declared qualified.

### Rejected circuit changes are retained, not adopted

Before outer-step sensitivity was identified, bounded physical variants
tested possible base-bias, emitter-current and receiver-loading mechanisms.
All remained in-memory diagnostics. The unchanged authored circuit is now
the repair target. The table records why none of those variants was admitted;
a numerical refusal is not evidence of physical oscillation or proof that
the corresponding hardware circuit is impossible.

| Runtime-only variant | Observed result and disposition |
| --- | --- |
| Feedback winding ratio 0.02 → 0.04 | Production refuses runaway at 6.0205 ms after one sample; the correction-off 16 ns reference refuses at 1.0110 ms. Rejected. |
| Grounded 100 kΩ bias divider, positions 0.060/0.065/0.070 | All remain below startup. Position 0.065 also lies between the public control's 0.01 increments. Rejected. |
| Same divider at 0.08 | Early RF range 6.729 mV–9.163 V and successful small/reversed controls initially look promising, but the 22–25 ms minimum is 13.336 mV, above the unchanged 10 mV quiet bound. Rejected. |
| Same divider at 0.09/0.10 | Position 0.09 has only one quiet sample and irregular output; 0.10 never reaches the quiet bound. Neither has a settled coupled-reference proof. Not admitted. |
| Divider 0.08, explicit inner 16/8 ns | Both refuse runaway near 0.286 ms. Inner 2/1 ns alone hit the unchanged look-ahead budget; combining them with a public 1 µs outer cap still refuses runaway near 0.279/0.277 ms. No converged reference. |
| Divider 0.09, emitter 3.3 kΩ, switched bypass 330 nF | Minimum RF is 10.643 mV, above the unchanged quiet bound. Rejected. |
| 10 kΩ divider, 1 kΩ base feed, 3.3 kΩ emitter, switched bypass 22 nF | Remains steadily active at 8.699–8.736 V without a quench tone. Raising only the emitter resistance to 10 kΩ prevents startup. Both rejected. |
| Original transmitter, receiver distance 0.50 → 0.63 m | The modelled link coefficient falls from 0.008 to 0.003999; RF remains steady at 8.903–8.917 V without a quench tone. Rejected. |

The earlier original-rheostat positions 0.0/0.6/0.9 and receiver-diode-removal
isolation remain in the immutable original receipt. Removing the diode
changes real loading, so its matching old/new transmitter traces do not
qualify the complete receiver circuit. The retained topology review is a
contemporaneous hypothesis: its inference from inner-only references is
superseded by the outer-step evidence above. No circuit value, generator,
lesson, fixture pin, physical assertion or threshold was changed for any of
these attempts.

A separate full-port nonlinear Newton reference prototype completed 11/11
manufactured-equation and refusal controls. It solves the complex endpoint
equation with independent real-block elimination, finite-difference
Jacobians, damped Newton steps and a fresh full-equation residual check;
it does not call the production consistency correction. It refuses after
bounded iteration/line-search limits rather than substituting an explicit
step. Those controls do not establish active-circuit root uniqueness,
full-circuit runtime, or a coupled RF/DC reference trajectory. No complete
Meissner run was qualified through that prototype, and it is not a proposed
shipping solver.

### Separate diagnostic receipt

The later evidence is retained in
[`rf-meissner-coupling-investigation-2026-11-27.json.gz`](../test/measurements/rf-meissner-coupling-investigation-2026-11-27.json.gz)
with its readable
[`manifest`](../test/measurements/rf-meissner-coupling-investigation-2026-11-27.manifest.json).
It contains 29 complete diagnostic records, 2,561 observation samples, 3,136
accepted-step timing samples, exact replay sources, runtime circuit snapshots
and original logs: 95 archived files in total. Each archived UTF-8 file has
its own hash and byte count. The feedback-only runtime circuit is reconstructed
from the recorded single-field mutation and matches the original record's
hash. The manifest also lists the archive's compressed and uncompressed
hashes. Read and verify it without running a simulator:

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const stem = 'test/measurements/rf-meissner-coupling-investigation-2026-11-27';
const manifest = JSON.parse(readFileSync(`${stem}.manifest.json`, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const compressed = readFileSync(`${stem}.json.gz`);
assert.equal(hash(compressed), manifest.archive.sha256);
const bytes = gunzipSync(compressed);
assert.equal(hash(bytes), manifest.archive.uncompressedSha256);
const receipt = JSON.parse(bytes);
for (const file of receipt.files) {
    assert.equal(hash(file.utf8), file.sha256);
    assert.equal(Buffer.byteLength(file.utf8), file.bytes);
}
console.log(receipt.records.map(({ path, disposition }) => ({ path, disposition })));
NODE
```

The supplier remains blocked pending a production history/coupling repair,
independent refinement and the unchanged physical positive/negative gates,
followed by the complete hosted test shards and WebGL. This checkpoint only
makes the diagnosis and rejected attempts durable.

## Reproduction

Use the exact Board candidate and unchanged CUI checkout; the probe records
their commits and source hashes in its output. It requires an explicit
artifact path and never changes a repository, fixture or shipped setting.

```sh
node scripts/probe-direct-conversion.mjs --case base --out /path/production-base.json
node scripts/probe-direct-conversion.mjs --case base --explicit-only --max-rf-k 7 --out /path/reference-128ns.json
node scripts/probe-direct-conversion.mjs --case base --explicit-only --max-rf-k 6 --out /path/reference-64ns.json
```

Repeat the reference commands with `--case tuned` and `--case sagged`.
`--case opposite` uses tuning 0.298; `--case disconnected` removes only the
RF coupling capacitor. `--board` and `--cui` select explicit checkout paths.
`--warmup-ms 2 --end-ms 5` reproduces the old observation window; the default
is 8–11 ms. The output retains the old whole-window crossing count beside
the phase and complete-period measurements, so their distinction is visible.

## Separate unqualified wide-range case

Tuning the transmitter as far as 0.6 is not part of the local tuning proof.
The explicit 128 ns reference fails transient convergence near 2.984 ms.
The production candidate completes, with a large out-of-audio carrier
difference, but that is not an independently qualified wide-range result.
Its roughly 249 kHz relative phase rate also exceeds the 50 kHz Nyquist
bound of the 10 µs output sampling; a fitted sampled phase slope near 49 kHz
would be an alias. The probe therefore withholds its phase-frequency summary
when the observed relative phase rates exceed that sampling bound.
No claim of general full-dial tuning correctness or passing silence is made
for that case. It remains reproducible with `--case far-detuned` and must
receive separate physical/reference investigation before qualification.
