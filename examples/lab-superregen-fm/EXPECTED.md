# lab-superregen-fm — expected behaviour

## Circuit
- 9 V battery. A BF199 in common base: base on a 10 kΩ / 10 kΩ divider held at RF by 100 pF; tank in the collector — an air-core VHF coil (0.15 µH, Q 80) to 9 V with a BB910 varicap from the collector to an RF-grounded (1 nF) node fed from the tuning pot through 100 kΩ (pot authored at 0.72); 3.3 pF collector→emitter and 10 pF emitter→ground close the Colpitts loop.
- Quench: a 25 kHz sine, 2 V peak, into the base through 1 kΩ.
- Emitter through 1 kΩ to 2.2 kΩ ‖ 1 nF; audio from there through 10 kΩ / 10 nF and 100 nF into a transistor biased by 1 MΩ with a magnetic earphone in its collector.
- The antenna (0.5 m, 2 pF) on the collector; its broadcast: one FM station at 98.0 MHz, 50 mV/m, 75 kHz deviation, 1 kHz tone.

## Observable behaviour
- The tank's RF comes in bursts of about 2.6 V at the quench rate; with the station it falls back between bursts only to about 0.11 V, the station's own level, and each burst grows from there.
- Without the station the bursts fall back to the noise floor (a tenth of a microvolt): each starts from a different random amplitude, so their average wanders and the earphone hisses.
- With the station the hiss goes quiet (about a seventh) and the 1 kHz programme stands above what is left of it — faintly: on the slope of its tank a super-regenerator is a poor FM detector, its output following the logarithm of the starting signal.

## Measured on the engine
bw-board r4/rf-20261123 (RF envelope front end: the quench in the transient solve, the oscillation in an envelope band whose growth follows the bias), `test/lab-circuits-rf.test.mjs`, 3 ms after 4 ms (RF every 10 µs; audio at the 10 nF, detrended, one-bin DFTs): station on — bursts 0.108 → 2.65 V, 1 kHz 9.5e-5 V, hiss (mean of the 1.33 and 2 kHz bins) 3.5e-5 V; station off — bursts 7e-8 → 2.57 V, hiss 2.5e-4 V. About 13 000 solves per simulated millisecond.

## What this verifies
1. An oscillator switched past its threshold grows exponentially from whatever signal it starts from.
2. Super-regeneration: the average current of a quenched oscillator follows the signal that starts each burst.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@a685b22` and `bw-circuit-ui@df78c46` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 39** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-superregen-fm` prints them one by one.
<!-- engine-provenance -->
