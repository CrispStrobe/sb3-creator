# lab-555-hysteresis-feedback — expected behaviour

## Circuit
- 9 V supply. INPUT (potentiometer_3, 10 kΩ across the supply) → 10 kΩ → NPN base (npn_5); 4.7 kΩ (resistor_6) in its emitter. Collector: 10 kΩ (resistor_7) to +9 V and 100 nF to ground; it is the tied trigger and threshold of a 555 (timer_555_9; switching at one third and two thirds of the supply).
- FEEDBACK: 4.7 kΩ (resistor_11) plus a 100 kΩ rheostat (potentiometer_12; 100 kΩ at position 0, 0 at position 1) from the 555 output back to the collector node.
- Red LED (1 kΩ) on the output.

## Observable behaviour
- Turning INPUT up pulls the collector below 3 V: the LED lights. Turning it down lets the collector rise above 6 V: the LED goes out.
- FEEDBACK at 104.7 kΩ: on at INPUT 0.39, off at 0.25 (a window of 0.14 of the travel). At 54.7 kΩ: 0.38 / 0.26. At 29.7 kΩ: 0.35 / 0.28.
- FEEDBACK at its minimum (4.7 kΩ): with INPUT below about 0.5 the LED flickers (18–28 changes in 10 ms); above about 0.55 it stays on.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`, INPUT stepped by 0.01 with 3 ms per step: windows 0.39/0.25, 0.38/0.26, 0.35/0.28; at minimum feedback 25, 27, 28, 27, 26, 23, 18 output changes per 10 ms at INPUT 0.20 … 0.50, none from 0.55 up.

## What this verifies
1. The 555's own window (3 V to 6 V on the collector) is a window of collector current, and so of INPUT position.
2. The feedback current from the output pushes the collector node the other way each time the output switches (output high lifts it, low pulls it down). In collector current the window is 3 V / 10 kΩ − 6 V / R: 0.24 mA at R = 104.7 kΩ, 0.19 mA at 54.7 kΩ, 0.10 mA at 29.7 kΩ, and nothing at 20 kΩ. The measured INPUT windows shrink the same way (0.14, 0.12, 0.07 of the travel).
3. Below about 20 kΩ the push is larger than the window: the output's own switching drives the node back across the other threshold and the trigger oscillates, at a rate the 100 nF sets.

## Simulation notes
At switch-on the 100 nF starts empty, so the 555 starts with its output high and turns it off a few milliseconds later; the asserts below read the input stage, which that does not touch.

```assert
# switched on, INPUT at 0.2: the emitter resistor sets the collector current (1.10 V / 4.7 kΩ)
net npn_5.base V 1.773 +-0.02
net npn_5.emitter V 1.097 +-0.02
net potentiometer_3.wiper V 1.796 +-0.02
net timer_555_9.control V 6.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-hysteresis-feedback` prints them one by one.
<!-- engine-provenance -->
