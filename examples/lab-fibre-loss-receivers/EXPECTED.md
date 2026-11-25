# lab-fibre-loss-receivers — expected behaviour

## Circuit
- 9 V supply. A red LED (`led_4`, 1 kΩ) feeds a 1 m light guide (`light_path_18`): one bend, a joint between two pieces, 1 mm air gap at the end. Its knob sets the bend radius from 0.4 to 5 cm; the joint's gap, offset and angle are set in the inspector (`jointGapMm`, `jointOffsetMm`, `jointAngleDeg`).
- The phototransistor (`phototransistor_5`) works into 1 kΩ with 100 nF across it: the signal voltage S.
- Pitch receiver: S is VCO_IN of a 4046 (`cd4046_8`: R1 = 47 kΩ, R2 = 470 kΩ, C1 = 10 nF), whose output sounds a piezo through 1 kΩ.
- Meter receiver: an LM358 (`lm358_14`) amplifies S by 2 (10 kΩ / 10 kΩ) onto a 5 V meter (`analog_meter_17`).

## Observable behaviour
- Gently bent guide (5 cm): S about 2.0 V, about 290 Hz, meter about 4.1 V.
- Bend it tighter: little changes until the radius is near 1 cm, then light is lost quickly; pitch and meter fall together.
- A gap, a sideways offset or an angle at the joint loses light too.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 12 ms after each change.

| path | S | pitch | meter |
|---|---|---|---|
| bend radius 5 cm | 2.03 V | 294 Hz | 4.06 V |
| bend radius 0.63 cm | — | 224 Hz | — |
| bend radius 0.4 cm | 1.06 V | — | 2.12 V |
| joint gap 0.5 mm | 0.817 V | 150 Hz | 1.63 V |
| joint offset 0.3 mm | — | — | 2.54 V |
| joint angle 10° | 1.68 V | — | 3.36 V |

## What this verifies
1. Bend loss grows sharply as the radius approaches the fibre's own scale; joint gap, offset and angle each lose light at the joint.
2. The meter reads exactly twice S at every loss: the op-amp receiver is linear.
3. The VCO's pitch follows S: 118 Hz per volt plus 53 Hz from R2.

## Simulation notes
The 4046 reports its frequency from its last full period, so each reading waits 12 ms (several periods) after the change.

```assert
# t = 1 ms, bend radius 5 cm
net phototransistor_5.emitter V 2.03 +-0.05
net lm358_14.1_out V 4.06 +-0.1
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fibre-loss-receivers` prints them one by one.
<!-- engine-provenance -->
