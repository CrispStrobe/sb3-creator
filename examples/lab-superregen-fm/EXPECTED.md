# lab-superregen-fm — expected behaviour

## Circuit
- 9 V battery. A BF199 in common base: base on a 10 kΩ / 10 kΩ divider held at RF by 100 pF; tank in the collector — an air-core VHF coil (0.15 µH, Q 80) to 9 V with a BB910 varicap from the collector to an RF-grounded (1 nF) node fed from the tuning pot through 100 kΩ (pot authored at 0.72); 3.3 pF collector→emitter and 10 pF emitter→ground close the Colpitts loop.
- Quench: a 25 kHz sine, 2 V peak, into the base through 1 kΩ.
- Emitter through 1 kΩ to 2.2 kΩ ‖ 1 nF; audio from there through 10 kΩ / 10 nF and 100 nF into a transistor biased by 1 MΩ with a magnetic earphone in its collector.
- The antenna (0.5 m, 2 pF) on the collector; its broadcast: one FM station at 98.0 MHz, 50 mV/m, 75 kHz deviation, 1 kHz tone.

## Observable behaviour
- The tank's RF comes in bursts of about 2.7 V at the quench rate; with the station it falls back between bursts only to about 0.11 V, the station's own level, and each burst grows from there.
- Without the station the bursts fall back to the noise floor (microvolts or less) and grow from there.
- Each burst starts from what the tank holds when the quench lets the stage oscillate: with the station it reaches 0.5 V about 2.9 µs into the quench cycle, every cycle at the same instant (± 0.04 µs); from the noise it gets there later, about 4.3 µs, and wanders by ± 0.4 µs from cycle to cycle.
- The audio is weak in this circuit and not claimed: at the detector the hiss (300 Hz–6 kHz) is 1.3e-4 V off the station and 7.6e-5 V on an unmodulated carrier — quieter by 2–5 times below 2 kHz — and the station's 1 kHz programme 3.2e-4 V. Its bursts grow so fast (an e-fold in about 0.1 µs) that the noise moves their start by only a fraction of a microsecond in a cycle where they last tens of microseconds; a slower-growing super-regenerator hisses louder and quiets more.

## Measured on the engine
bw-board RF envelope front end (the quench in the transient solve, the oscillation in an envelope band whose growth rate is re-estimated as the quench moves the bias), `test/lab-circuits-rf.test.mjs`, 3 ms after 4 ms (RF every 10 µs): station on — bursts from 0.107 V to about 2.7 V; station off — from a few µV or less to about 2.7 V; burst start (0.5 V) with the station 2.85 ± 0.04 µs into the cycle, without 4.28 ± 0.42 µs. The burst peaks agree within 0.5 % with 1 ns band steps (until 2026-11-24 the adaptive steps overshot them by up to 40 %, and the level was 3 V while the transistor's input capacitance was taken at its DC current). About 10 000 band substeps and 13 000 transient solves per simulated millisecond (≈ 3.5 s of wall time).

## What this verifies
1. An oscillator switched past its threshold grows exponentially from whatever signal it starts from.
2. Super-regeneration: the average current of a quenched oscillator follows the signal that starts each burst.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 54** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-superregen-fm` prints them one by one.
<!-- engine-provenance -->
