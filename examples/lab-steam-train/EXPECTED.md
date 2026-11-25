# lab-steam-train — expected behaviour

## Circuit
- 9 V supply. A two-transistor astable: 2.2 kΩ collector resistors, 100 kΩ base resistors, 2.2 µF cross-coupling electrolytics, about 3 Hz.
- The noise source of lab-noise-hiss (an NPN with `bvEbo` 7.5 (volts), base grounded, collector open; simulated noise band 1 kHz) is fed through 47 kΩ from the collector of the astable's right-hand transistor instead of from +9 V.
- 10 nF into a common-emitter stage (470 kΩ collector-to-base, 4.7 kΩ), 100 nF into an output stage (470 kΩ collector-to-base, 470 Ω emitter) with a 2 kΩ magnetic earphone as its load.

## Observable behaviour
- The astable starts with the feed low for about 0.17 s: no breakdown current, silence.
- Then the feed is high (about 8.9 V) for about 0.16 s: the junction breaks down and the earphone hisses (level about 0.37, reported as noise).
- Low again: no breakdown current, and the earphone falls silent within the gap. Chuff … chuff …

## Measured on the engine
At 0.12 s feed below 0.5 V and no breakdown current; at 0.23 s feed above 8 V, earphone level 0.37 with `noise: true`; at 0.47 s feed low, no breakdown current, earphone silent. `test/lab-circuits-fields.test.mjs` holds these.

## Why
The noise only exists while the junction is pushed past its breakdown voltage, and that only happens while the astable's transistor is off and its collector is high. The small coupling capacitors pass the hiss but not the slow edges of the gate, so the amplifier is quiet again within each gap.

## What this verifies
1. Gating a noise source with an astable.
2. The rhythm is set by the astable's RC network.

```assert
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-steam-train` prints them one by one.
<!-- engine-provenance -->
