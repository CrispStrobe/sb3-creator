# lab-transistor-v-to-f — expected behaviour

## Circuit
- 9 V supply. LM358 half 2 buffers half the supply from 10 kΩ / 10 kΩ: the reference.
- Half 1 is an integrator: + input at the reference, 220 nF from output to - input, 100 kΩ from the - input to the INPUT pot's wiper. The pot (10 kΩ) spans the reference to ground.
- Schmitt trigger from two NPNs sharing a 2.2 kΩ emitter resistor: Q1's base is the integrator output, 1 kΩ collector; Q1's collector reaches Q2's base through 1 kΩ, with 5.1 kΩ from Q2's base to ground; 1 kΩ collector for Q2.
- Reset: an NPN across the integrating capacitor (collector at the output, emitter at the - input). Its base is fed from Q2's collector through 10 kΩ, with 22 kΩ to ground.
- A piezo through 10 kΩ from Q2's collector.

## Observable behaviour
- The integrator output ramps up from about 5.05 V at a rate set by how far the wiper sits below 4.5 V.
- At about 6.42 V the Schmitt trigger flips: Q2 turns off, its collector rises toward 9 V and turns the reset transistor on, which empties the capacitor. At about 5.05 V the trigger flips back and the next ramp starts. A sawtooth.
- INPUT 0.5 (wiper 2.30 V): about 72 Hz. INPUT 0.25 (wiper 1.19 V): about 109 Hz. INPUT 0.75 (wiper 3.40 V): about 36 Hz.
- The rate per volt below the reference stays the same: about 33 Hz per volt. The piezo sings at that rate.

## Measured on the engine
Ramp 5.05 V to 6.42 V. Rates 72.4 Hz (wiper 2.305 V), 109.1 Hz (1.187 V), 36.5 Hz (3.396 V): 33.0, 32.9 and 33.0 Hz per volt below 4.5 V. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
The integrator's ramp rate is (4.5 V − wiper) / (100 kΩ · 220 nF), and each ramp has to climb the same 1.37 V of hysteresis, so the time per ramp is inversely proportional to the input: f = (4.5 V − wiper) / (100 kΩ · 220 nF · 1.37 V), about 33 Hz per volt. While Q2 conducts its collector sits at about 6.4 V, and the divider puts the reset base below the 4.5 V at its emitter; only when Q2 is off does the base get past that.

## What this verifies
1. An integrator plus a Schmitt trigger and a reset switch convert a voltage into a frequency.
2. The trigger can be built from two transistors with a shared emitter resistor.

```assert
# t = 1 ms: reference up, first ramp just begun, Q2 conducting
net vsource_2.pos V 9.00 +-0.01
net lm358_3.2_out V 4.50 +-0.01
net potentiometer_6.wiper V 2.305 +-0.01
net npn_9.emitter V 5.75 +-0.05
net npn_10.collector V 6.21 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 47** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-transistor-v-to-f` prints them one by one.
<!-- engine-provenance -->
