# lab-noise-level-meter — expected behaviour

## Circuit
- 9 V supply. A magnetic earphone (`earphone_3`, 2 kΩ) is the microphone; it hears the learner's sound (`soundDb` 70, a voice at 150 Hz).
- First stage: an LM358 (`lm358_7`) non-inverting amplifier, gain 101 (1 MΩ / 10 kΩ). The earphone sits between its + input and a half-supply bias (2.2 kΩ / 2.2 kΩ, 10 µF), and the 10 kΩ returns to the same bias, so the stage has gain 1 for DC.
- Second stage: 100 nF into an LM386 (`lm386_11`, gain 20, 1 µF on BYPASS).
- Rectifier: 1 µF from the LM386 output to the base of `npn_16`, clamped by a diode to ground (22 kΩ base to ground). The NPN's emitter charges 2.2 µF across a 5 V meter (`analog_meter_18`, 0.5 mA movement, 10 kΩ).

## Observable behaviour
- Quiet: the meter rests near zero (it takes about 0.1 s after power-on to drain).
- 70 dB: a small deflection, about 0.16 V.
- 80 dB: about 2.4 V. Ten decibels more is about three times the sound pressure; the rectifier's threshold makes the needle grow faster than that.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 40 ms after each change.

| sound | LM358 output | LM386 output | meter |
|---|---|---|---|
| none, 100 ms after power-on | — | — | 0.08 V |
| 70 dB | — | — | 0.157 V |
| 80 dB | 0.213 V p-p | 4.28 V p-p | 2.43 V |

## What this verifies
1. The earphone as a microphone gives a fraction of a millivolt; two stages (×101, ×20) bring it to volts.
2. The clamp diode and the emitter follower form a peak rectifier: the meter shows the peak-to-peak swing less one base-emitter drop.

## Simulation notes
The assert block reads the start-up instant, 1 ms after power-on, while the 10 µF bias capacitor is still charging; the first stage follows that bias with gain 1.

```assert
# t = 1 ms, start-up: the bias capacitor charging
net polarized_cap_6.pos V 0.391 +-0.03
net lm358_7.1_out V 0.331 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-noise-level-meter` prints them one by one.
<!-- engine-provenance -->
