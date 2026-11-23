# lab-noise-hiss — expected behaviour

## Circuit
- 9 V supply. The noise source: 47 kΩ from +9 V into the emitter of an NPN whose base is grounded and whose collector is left open. Its base-emitter junction breaks down (`bvEbo` 7.5, in volts), with avalanche noise; the simulated noise band is 1 kHz (`noiseBandwidthHz`).
- 100 nF couples the emitter into a common-emitter stage: 470 kΩ collector-to-base, 4.7 kΩ collector resistor.
- 1 µF couples that into a second stage: 470 kΩ collector-to-base, 470 Ω in the emitter, a 2 kΩ magnetic earphone as the collector load.

## Observable behaviour
- The noise transistor's emitter sits at about 7.53 V: just past the breakdown voltage. About 31 µA flow through the 47 kΩ.
- The earphone hisses: its readout reports `noise` (the coil current crosses zero at random intervals), loud (level about 0.8 of full).

## Measured on the engine
After 40 ms: emitter 7.53 V, breakdown current 31.4 µA, noise current 0.32 µA rms in the simulated band, earphone level 0.85 with `noise: true`. `test/lab-circuits-fields.test.mjs` holds these.

## Why
In avalanche breakdown each carrier that starts an avalanche arrives with a burst of others; the bursts start at random. The current noise is shot noise, 2·q·I, multiplied by a large excess factor. Across the junction's own dynamic resistance (about Vt / I, under a kilohm) that is roughly a millivolt of noise. Two stages raise it to earphone level.

## What this verifies
1. Reverse breakdown of a base-emitter junction.
2. Avalanche noise as a signal source.

```assert
# the supply rail; the junction reaches its breakdown voltage only once the
# coupling capacitor behind it has charged (about 5 ms), which the scenario
# test checks at 40 ms
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@a685b22` and `bw-circuit-ui@df78c46` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-noise-hiss` prints them one by one.
<!-- engine-provenance -->
