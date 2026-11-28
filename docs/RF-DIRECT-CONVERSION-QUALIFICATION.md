# Direct-conversion whistle: physical qualification

Status: local candidate proof; exact upstream qualification and fixture
adoption remain required. The engine candidate is bw-board
`6b9e281ca0104ebccacca6d8020295fe18ceb929`, based on master
`d21d6d8b819263eb08231134b7556efa82289a90`. The CUI checkout is the unchanged
fixture `ee2b4127a88f1b308f8d749cae4d7c1db1deae9e`.

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
drifting carrier phase, and flat saturated output. These local checks precede
the complete supplier corpus and CI qualification at an adopted upstream pin.

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

## Against bw-board d21d6d8b (2026-11-28)

sb3-creator is to pin bw-board `d21d6d8b`, which predates #782. The settled-beat scenario fails there at its first guard, "9 V, tuning 0.3: rfAmplitude remains active". MEASURED with `node scripts/probe-direct-conversion.mjs --board <d21d6d8b> --cui <ee2b4127> --case base`:

| Quantity, 8–11 ms | d21d6d8b | b47e7e09 (production, above) | Guard |
| --- | ---: | ---: | --- |
| received RF at the mixer | 0.0089–0.258 V | 0.095–0.143 V | > 0.05 V, max/min < 1.02 |
| LO | 2·10⁻⁸ to 13.7 V | 5.775–5.779 V | > 4 V, max/min < 1.02 |
| transmitter B–C swing | 0.57–15.6 V | steady | — |
| speaker periodic jitter | 0.91 | ≤ 0.0038 | < 0.05 |

On `d21d6d8b` both oscillators burst, and the probe withholds the phase beat: "the input carrier or LO is below the observation floor". This adoption therefore needs the #782 engine; no assertion was changed to pass on the older one.
