# lab-common-base — expected behaviour

## Circuit
- 9 V supply, a function generator: 1 kHz sine, 0.2 V peak. Three NPN stages, each biased by 47 kΩ / 10 kΩ with a 1 kΩ emitter resistor, each fed through its own 10 µF.
- Common emitter: signal on the base, 4.7 kΩ collector resistor, output at the collector.
- Common collector (emitter follower): signal on the base, collector at +9 V, output at the emitter.
- Common base: the base held still by 10 µF to ground; the signal pushed into the emitter through 1 kΩ; 4.7 kΩ collector resistor, output at the collector.
- Two oscilloscopes: one shows the input and the follower, the other the two collectors.

## Observable behaviour
- Common emitter: about 4.6 times the input, upside down.
- Common collector: the same size as the input (gain about 1.00), the right way up.
- Common base: about 4.6 times the input and the right way up, but the stage draws its input current straight through the emitter: its input resistance is only the 1 kΩ in front of it plus a few tens of ohms.

## Measured on the engine
Gain (regression of output on input over 2 ms after 300 ms): common emitter −4.62, common collector 0.998, common base +4.62. `test/lab-circuits-r6d.test.mjs` holds these.

## What this verifies
1. The same transistor gives three different amplifiers, depending on which lead is shared by input and output.
2. Common emitter inverts, common base does not; both have gain about R_C divided by the resistance in the emitter path.

```assert
# t = 1 ms: supply only; the bias capacitors take tens of milliseconds to charge
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-common-base` prints them one by one.
<!-- engine-provenance -->
