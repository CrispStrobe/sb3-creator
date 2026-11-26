# lab-amp-blinker — expected behaviour

## Circuit
- 9 V supply. An LM386 power amplifier (pins 1 and 8 open, gain 20) wired as a relaxation oscillator: 47 kΩ from the output and 100 kΩ from +9 V to the + input, 1 nF across the 47 kΩ; 10 kΩ from the output to the − input and a 10 µF electrolytic from there to ground.
- Red LED with 1 kΩ from the output to ground (lit while the output is high); green LED with 1 kΩ from +9 V to the output (lit while it is low).
- A switch connects a loudspeaker to the output through 10 µF and 33 Ω.

## Observable behaviour
- At switch-on the output is high (8.1 V) and red is lit; the 10 µF charges until the − input passes the + input's 5.1 V, the output drops to 0.9 V, green lights, and the capacitor discharges to the lower threshold before the next flip.
- Red and green take turns about six times a second (half period about 80 ms).
- Switch open: the speaker is silent. Closed: it clicks at every flip (the 10 µF passes only the edges).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: flips at 117, 199, 277, 359 and 439 ms (half periods 78–82 ms); red 6.39 mA while the output is high, green 6.09 mA while it is low; speaker 0 V with the switch open, 0.84 V peaks at the edges with it closed.

## What this verifies
1. A power amplifier with resistive positive feedback and an RC on the other input is a relaxation oscillator.
2. One push-pull output can light two LEDs alternately: one to ground, one to the supply.
3. A capacitor passes the edges of a slow square wave as clicks.

## Simulation notes
The LM386 macromodel has 50 kΩ from each input to ground; the thresholds include it. Each flip of the amplifier costs the solver a few hundred steps, so the test watches five flips.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_3.vout V 8.10 +-0.02
net lm386_3.inp V 5.12 +-0.02
net led_10.anode V 1.71 +-0.03
net led_12.anode V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-blinker` prints them one by one.
<!-- engine-provenance -->
