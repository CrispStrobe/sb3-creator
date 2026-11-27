# lab-ptc-fibre-pll — expected behaviour

## Circuit
- 9 V supply. The temperature stage of lab-ptc-fibre-tone: 22 kΩ over a PTC sensor (`ptc_sensor_4`, silicon, thermal time constant 50 ms) into an LM386 (`lm386_7`, gain 20) against a set pot (`potentiometer_5`).
- The LM386 output feeds both 10 kΩ base resistors of a two-transistor astable (`npn_9`, `npn_10`, 47 nF, 1 kΩ collector on one side, a red LED and 470 Ω on the other): about 900 flashes per second at 25 °C, more when warmer.
- A 2 m light guide to a phototransistor (`phototransistor_17`, 1 kΩ emitter load), 10 nF into a 4046 (`cd4046_20`). VCO: 100 kΩ, 2.2 nF; comparator II through 22 kΩ and 2.2 kΩ + 100 nF holds it on the incoming rate.
- The demodulator output (10 kΩ load) through 10 kΩ / 220 nF to an analog meter (`analog_meter_29`, 10 V full scale).

## Observable behaviour
- 25 °C: the VCO near 880 Hz, the meter about 3 V.
- 45 °C: the VCO near 1050 Hz, the meter about 3.8 V.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs` (12 ms from power-on).

| surroundings | VCO | control voltage | meter |
|---|---|---|---|
| 25 °C | 880 Hz | 3.60 V | 3.05 V |
| 45 °C | 1047 Hz | 4.31 V | 3.78 V |

## What this verifies
1. Pulse-rate coding: an amplified sensor voltage sets an astable's rate.
2. A 4046 loop as a frequency-to-voltage converter at the receiving end.

```assert
# t = 1 ms, 25 C
net ptc_sensor_4.a V 0.724 +-0.01
net lm386_7.vout V 5.07 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-fibre-pll` prints them one by one.
<!-- engine-provenance -->
