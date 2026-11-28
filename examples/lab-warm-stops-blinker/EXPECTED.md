# lab-warm-stops-blinker — expected behaviour

## Circuit
- 9 V battery, two NPN transistors.
- Q1 is biased by a divider: 18 kΩ plus a 10 kΩ trim pot (wired as a variable resistor, authored at 0.65) from the battery to its base, 2.2 kΩ from base to ground. Its emitter has 220 Ω to ground: negative feedback that makes its collector current set by the base voltage. Collector resistor 10 kΩ.
- Q2's base is driven from Q1's collector through 4.7 kΩ; Q2's collector drives a red LED (680 Ω from the battery).
- A 47 µF capacitor from Q2's collector back to Q1's base closes a loop with positive feedback for changes.
- Q1 sits in its own surroundings (`surroundC`, 25 °C as authored, thermal time constant 1.5 s): its temperature slider is the experiment.

## Observable behaviour
- At room temperature the bias puts Q1 just inside the narrow range where both transistors amplify: the loop through the capacitor oscillates and the LED blinks, about 1.2 times a second.
- Warm Q1 (fingers, hot water): its base-emitter voltage falls by two millivolts per kelvin, so at the same base voltage it conducts more. Its collector is pulled so low that Q2 stays off: the blinking stops with the LED dark. Fingers (33 °C) only slow it; hot (70 °C) stops it within a few seconds.
- Let it cool back to room temperature and the blinking restarts.
- In ice water (0 °C) the edge is crossed the other way: Q1 conducts too little, Q2 stays on, the LED stays lit.
- The trim pot moves the edge: a learner can set the circuit to stop at a chosen temperature.

## Measured on the engine
- 25 °C: LED edges every 0.36 to 0.48 s (6 edges in the first 2.5 s).
- 33 °C: still blinking, slower; 45 °C: edges about 0.45 and 1.55 s apart; 70 °C: none, Q2's collector at 7.7 V.
- 0 °C: none, Q2's collector below 0.2 V (LED lit).
- Warmed from 25 °C to 70 °C: no edge in the 2 s after a 4 s wait; back at 25 °C: blinking again within 4 s.

## What this verifies
1. A silicon junction's forward voltage falls with temperature (two millivolts per kelvin), so a transistor at fixed base voltage conducts more when warm.
2. An amplifier with positive feedback oscillates only while its gain is high enough; biased to the edge, a small shift in operating point switches the oscillation on or off.
3. A transistor can itself be the temperature sensor.

## Simulation notes
The thermal model is opt-in per part: only Q1 has `surroundC`. `test/lab-circuits-r6b.test.mjs` runs the bench at 25 °C, moves Q1's surroundings to 70 °C and back, and checks the ice-cold case.

```assert
# t = 1 ms at 25 C: the loop is still starting up.
net capacitor_13.b V 1.609 +-0.05
net npn_10.base V 0.682 +-0.03
net led_12.anode V 3.426 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-warm-stops-blinker` prints them one by one.
<!-- engine-provenance -->
