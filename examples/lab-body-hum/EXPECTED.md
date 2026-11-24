# lab-body-hum — expected behaviour

## Circuit
- 9 V supply. A touch plate (field probe, source: the learner's body, touched through 1 MΩ of skin; the knob is the touch, 0 = not touching) feeds 100 nF into a common-emitter stage: 1 MΩ collector-to-base, 4.7 kΩ collector resistor.
- 1 µF couples it into a second stage, 470 kΩ collector-to-base, with a 2 kΩ magnetic earphone as its collector load.
- The body: 3 pF to the house wiring, 150 pF to the floor, so a few volts of 50 Hz. The battery circuit floats on 50 pF to the room.

## Observable behaviour
- Not touching: silence.
- Touching (knob 1): a 50 Hz hum in the earphone, level about 0.8 of full; at the plate only about 2 mV.

## Measured on the engine
Knob 1, after 0.25 s: 50 Hz, earphone level 0.795, input 2.3 mV of 50 Hz, second collector 1.9 V of 50 Hz. `test/lab-circuits-fields.test.mjs` holds these.

## Why
The body is a conductor between the wiring and the floor; its share of the mains, behind its capacitance, pushes a tiny current through the skin and the first stage's base. Two stages amplify it to earphone level.

## What this verifies
1. The body picks up mains hum capacitively.
2. A high-gain AC amplifier makes it audible.

```assert
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@4c57f3a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-body-hum` prints them one by one.
<!-- engine-provenance -->
