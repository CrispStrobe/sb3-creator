# lab-555-mic-fm — expected behaviour

## Circuit
- 9 V supply. A loudspeaker (speaker_3) as the microphone into the two-stage NPN preamp (npn_5 with 470 Ω emitter resistor, npn_10 with 100 Ω; 1 MΩ collector-to-base feedback and 10 kΩ loads; 1 µF and 100 nF coupling).
- 1 µF (polarized_cap_14) and 1 kΩ (resistor_15) couple the second collector onto the control pin of a 555 astable (timer_555_16; 1 kΩ, 4.7 kΩ, 100 nF: about 1.4 kHz) on a piezo.

## Observable behaviour
- Silence: a steady tone, every period 0.72–0.73 ms.
- Speech at 94 dB: the periods spread from 0.68 to 0.76 ms: the pitch wobbles by about ±5 % with the voice.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`, periods timed on the 555 output with 10 µs resolution over 12 ms: silence 0.72–0.73 ms, 94 dB voice 0.68–0.76 ms.

## What this verifies
1. The preamp turns the loudspeaker's millivolts into a signal of about a volt.
2. A voltage on the 555's control pin moves both thresholds and so the period: speech frequency-modulates the tone.

## Simulation notes
The learner's voice is the engine's sustained vowel at 150 Hz. Each millisecond of listening costs the solver about a second (the listening loudspeaker caps the time step), so the test times the tone over 12 ms windows after 0.2 s of settling. Quieter speech (70 dB) moves the period by less than the 10 µs the test resolves.

```assert
# switch-on (a transient: the coupling capacitors are still charging)
net timer_555_16.reset V 9.0 +-0.01
net npn_5.emitter V 0 +-0.01
net npn_5.collector V 5.979 +-0.1
net timer_555_16.control V 2.502 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-mic-fm` prints them one by one.
<!-- engine-provenance -->
