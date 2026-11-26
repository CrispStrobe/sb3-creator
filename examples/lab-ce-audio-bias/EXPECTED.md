# lab-ce-audio-bias — expected behaviour

## Circuit
- 9 V battery. One NPN in common emitter: 220 Ω emitter resistor, 2.2 kΩ collector load from 9 V, with a red LED and 1 kΩ in series across the load (it lights more as the collector falls).
- Base bias: 4.7 kΩ and a 100 kΩ bias pot (as a rheostat, authored at 0.80) from 9 V, 4.7 kΩ to ground.
- Signal: a generator (500 Hz sine, 0.1 V, standing in for a music player) through 1 kΩ and 10 µF into the base; the collector drives a magnetic earphone through 10 µF.

## Observable behaviour
- Bias pot at 0.80: the collector sits near 6.0 V and swings about ±0.18 V around it, a clean copy of the input (second harmonic about 0.5 % of the fundamental), upside down.
- Bias pot at 0.50 (too little bias): the collector sits near 8.7 V, close to cut-off; the half-wave that would lift it further is flattened (second harmonic about 42 % of the fundamental).
- Bias pot at 0.95 (too much bias): the transistor is nearly saturated at about 2.1 V; the half-wave that would pull it lower is flattened (second harmonic about 43 %, the fundamental down to a third).
- Generator turned up to 2.5 V with the pot at 0.85: the collector runs between about 2.2 V and 7.3 V and both halves are flattened — a strong third harmonic (about 17 % of the fundamental), the symmetric distortion of overdrive.

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (10 ms of collector after 150 ms): pot 0.80 mean 6.04 V, fundamental 0.178 V, H2/H1 0.005; pot 0.50 mean 8.66 V, H2/H1 0.42; pot 0.95 mean 2.10 V, H2/H1 0.43; pot 0.85 with 2.5 V in: 2.24–7.30 V, H3/H1 0.17.

## What this verifies
1. The signal rides on the bias: the operating point decides how much room each half-wave has.
2. A badly set bias clips one half (even harmonics); overdrive clips both (odd harmonics).

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ce-audio-bias` prints them one by one.
<!-- engine-provenance -->
