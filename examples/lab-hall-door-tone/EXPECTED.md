# lab-hall-door-tone — expected behaviour

## Circuit
- 9 V supply. A Hall sensor module (`hall_analog_3`) is used for its switching output `do`: high without a magnet, low while the field (either pole) is past its threshold of 0.5.
- The output drives `npn_5`'s base through 10 kΩ and pulls a green LED (`led_7`, 1 kΩ from +9 V) low.
- `npn_5`'s collector holds the timing node of an LM386 tone oscillator (`lm386_8`: 1 MΩ / 1 MΩ positive feedback, 220 kΩ / 47 nF timing, gain 200) at ground; 220 µF drives the speaker.

## Observable behaviour
- No magnet: LED dark, silent.
- Magnet (field 0.8): the LED lights and the speaker sounds about 500 Hz.
- Magnet away: silent again.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`.

| field | Hall output | `npn_5` collector | LED | sound |
|---|---|---|---|---|
| 0 | 8.96 V | 0.018 V | 0.04 V | none (0.02 V swing) |
| 0.8 | low | released | 2.02 V | 495 Hz |

## What this verifies
1. The Hall switch's output changes state at its field threshold.
2. The transistor between them turns "magnet present" into "oscillator released": the LM386 relaxation oscillator starts.

```assert
# t = 1 ms, no magnet
net hall_analog_3.do V 8.96 +-0.05
net npn_5.collector V 0.018 +-0.02
net npn_5.base V 0.70 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hall-door-tone` prints them one by one.
<!-- engine-provenance -->
