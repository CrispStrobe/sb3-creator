# lab-cb-button — expected behaviour

## Circuit
- 9 V battery. One NPN in common base: its base sits on a 47 kΩ / 22 kΩ divider held at signal frequencies by 4.7 µF; the emitter returns to ground through 2.2 kΩ; the collector load is 2.2 kΩ from 9 V with a green LED and 1 kΩ in series across it.
- Input: the emitter. A button pulls it down through another 2.2 kΩ; a generator (1 kHz sine, 20 mV) drives it through 100 Ω and 47 µF. Oscilloscope: channel 1 the emitter, channel 2 the collector.

## Observable behaviour
- At rest (after the divider's capacitor has charged): emitter about 2.04 V, collector about 7.15 V; the LED glows faintly.
- Button held: the emitter is pulled down to about 1.96 V, more current flows and the collector falls to about 6.53 V — both move down together (in phase), and the LED brightens.
- The 1 kHz signal comes out at the collector about 9 times larger than the generator's and in phase with it (within a few degrees): a common-base stage amplifies voltage without inverting.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (after 400 ms; 5 ms of signal): emitter 2.042 V, collector 7.155 V; gain collector/generator 8.92, phase −2.1°; button held 100 ms: emitter 1.956 V, collector 6.531 V.

## What this verifies
1. In common base the emitter is the input and the collector follows it in the same direction.
2. The stage has voltage gain (load over the emitter's small-signal resistance) and no inversion.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-cb-button` prints them one by one.
<!-- engine-provenance -->
