# lab-amp-midpoint — expected behaviour

## Circuit
- 9 V supply. An LM386 with both inputs grounded (pins 1, 7, 8 open): its output sits at its internal half-supply point.
- A slide switch (slide_switch_6) takes the midpoint from the LM386's output (left, as built) or from two 10 kΩ resistors across the supply (right).
- An LM358 inverting amplifier: the INPUT pot (potentiometer_7, across the supply, at 0.25 as built) through 10 kΩ into the − input, 10 kΩ feedback, + input on the midpoint.
- Its output, through 470 Ω, drives a red LED (anode on the output side) and a green LED (the other way) to the midpoint; a voltmeter reads the output against the midpoint.

## Observable behaviour
- LM386 midpoint: 4.50 V whatever the LEDs draw. The output is the input mirrored about it: input 2.6 V → output 6.39 V (red, 0.73 mA); input 6.4 V → 2.61 V (green); input 9 V → 0.27 V (green, 4.8 mA).
- Divider midpoint: dragged to 5.85 V or 2.10 V by the same currents; the mirror fails.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: LM386 midpoint 4.500 V (4.499 V while sinking 4.78 mA); wiper 2.605 V → output 6.394 V, LED 0.726 mA; 6.395 → 2.605 V; 8.999 → 0.270 V with the green LED lit; divider midpoint 5.846 V (input low) and 2.101 V (input high).

## What this verifies
1. A power amplifier's output is a low-impedance half-supply point, usable as the ground of a ±4.5 V split supply.
2. An inverting amplifier mirrors its input about its reference.
3. A resistor divider is no supply: loaded, its midpoint moves.

## Simulation notes
Pin 7 (bypass) is left open: with a capacitor there the midpoint rises over a few hundred milliseconds at switch-on (10 µF against the internal 14 kΩ network).

```assert
# 1 ms after switch-on (the solve assert-physics runs): input pot at 0.25
net lm386_3.vout V 4.50 +-0.01
net potentiometer_7.wiper V 2.605 +-0.02
net lm358_10.1_out V 6.394 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **27 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-midpoint` prints them one by one.
<!-- engine-provenance -->
