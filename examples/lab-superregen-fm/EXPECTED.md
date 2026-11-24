# lab-superregen-fm — expected behaviour

## Circuit
- 9 V battery. A BF199 in common base: base on a 10 kΩ / 10 kΩ divider held at RF by 100 pF; tank in the collector — an air-core VHF coil (0.15 µH, Q 80) to 9 V with a BB910 varicap from the collector to an RF-grounded (1 nF) node fed from the tuning pot through 100 kΩ (pot authored at 0.72); 3.3 pF collector→emitter and 10 pF emitter→ground close the Colpitts loop.
- Quench: a 25 kHz sine, 2 V peak, into the base through 1 kΩ.
- Emitter through 1 kΩ to 2.2 kΩ ‖ 1 nF; audio from there through 10 kΩ / 10 nF and 100 nF into a transistor biased by 1 MΩ with a magnetic earphone in its collector.
- The antenna (0.5 m, 2 pF) on the collector; its broadcast: one FM station at 98.0 MHz, 50 mV/m, 75 kHz deviation, 1 kHz tone.

## Observable behaviour
- The tank's RF comes in bursts of about 2.6 V at the quench rate; with the station it falls back between bursts only to about 0.11 V, the station's own level, and each burst grows from there.
- Without the station the bursts fall back to the noise floor (microvolts or less) and grow from there.
- Not reproduced robustly: the station's programme in the earphone and the hiss going quiet when the station is tuned in. Both depend on how the noise floor each burst starts from is treated numerically (with 1 ns band steps the hiss fell to a seventh with the station; with 4 ns steps not at all), so this page claims neither.

## Measured on the engine
bw-board RF envelope front end (the quench in the transient solve, the oscillation in an envelope band whose growth rate is re-estimated as the quench moves the bias), `test/lab-circuits-rf.test.mjs`, 3 ms after 4 ms (RF every 10 µs): station on — bursts from 0.107 V to about 3 V; station off — from a few µV or less to about 3 V. About 5 300 band substeps and 5 700 transient attempts per simulated millisecond (≈ 5 s of wall time each).

## What this verifies
1. An oscillator switched past its threshold grows exponentially from whatever signal it starts from.
2. Super-regeneration: the average current of a quenched oscillator follows the signal that starts each burst.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d5501af` and `bw-circuit-ui@0efc30a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 36** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-superregen-fm` prints them one by one.
<!-- engine-provenance -->
