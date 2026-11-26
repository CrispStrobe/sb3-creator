# lab-xor-reflect — expected behaviour

## Circuit
- 5 V supply. Gate 1 of a 74HC132 with 22 kΩ / 100 nF is the clock (about 570 Hz). Through 4.7 kΩ (10 nF at the base) it switches an NPN that runs an IR LED from +5 V through 100 Ω.
- A white surface (a light path with a distance knob, 1 to 20 cm; 2 cm as authored) reflects the IR onto a phototransistor with a 10 kΩ pull-up. Gate 2 of the 74HC132, inputs joined, squares the received signal up again (high while light arrives); a yellow LED with 470 Ω shows it.
- The four gates of a 74HC00 form an exclusive-OR of the clock and the received signal.
- 47 kΩ / 220 nF average the XOR (node N). Half of an LM358 compares N, through another 47 kΩ, with a reference from 33 kΩ / 10 kΩ. A red LED (output to - input) and a 1N4148 (- input to output) in its feedback stop the output short of either supply rail. A green LED with 470 Ω on the output shows "object there". The second LM358 half is unused.

## Observable behaviour
- Surface at 2 cm, room dark: the light that comes back is the LED's own, so the received signal equals the clock and the XOR stays low. N settles near 0.6 V, the comparator output is high (about 2.5 V) and the green LED lights.
- Surface moved away (20 cm): nothing comes back, the received signal stays low, the XOR follows the clock. N rises to about 1.65 V, the output drops to about 0.8 V, the green LED goes out. The yellow LED is dark.
- No surface, but a lamp on the phototransistor (its light slider at 0.5): the received signal is high all the time and the yellow LED stays lit, so a plain light barrier would report an object. The XOR follows the inverted clock, N goes to about 2.0 V and the green LED stays dark.
- A lamp that bright also blinds the barrier to a real reflection: with the surface back at 2 cm the green LED stays dark until the lamp goes off.

## Measured on the engine
In 1 ms steps, read after each 60 ms phase: 2 cm: N 0.59 V, output 2.52 V. 20 cm: N well above the reference, output 0.79 V. 20 cm with the lamp at 0.5: N 2.01 V, output low, the received signal high in 10 of 10 readings. Surface at 2 cm with the lamp at 0.5: output still low. Lamp off, surface at 2 cm: output 2.52 V again. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
Exclusive-OR is low only when its two inputs agree. The clock and the light that the clock itself sent out agree all the time; steady light, or no light, agrees with the clock only half the time. Averaging the XOR turns that into a voltage a comparator can judge.

## Simulation notes
The comparator's output is held off the supply rails by the two feedback elements. With the output allowed to swing into the LM358's own limits, the engine's step controller ran out of attempts (step-attempt-budget-exceeded) whenever the output reached a limit while the gates were switching (found while building this bench; reported). The 10 nF at the driver's base rounds the LED's edges a little for the same reason.

## What this verifies
1. An XOR of the transmitted and the received signal detects only the transmitter's own light.
2. Room light alone, which fools a plain light barrier, does not trigger it.

```assert
# t = 1 ms: reflection from the start, comparator high
net vsource_2.pos V 5.00 +-0.01
net lm358_19.1_pos V 1.163 +-0.01
net lm358_19.1_out V 2.55 +-0.05
net resistor_14.b V 0.105 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-xor-reflect` prints them one by one.
<!-- engine-provenance -->
