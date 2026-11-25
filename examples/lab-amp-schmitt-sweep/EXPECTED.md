# lab-amp-schmitt-sweep — expected behaviour

## Circuit
- 9 V supply. LM386 (lm386_3) with pins 1 and 8 joined by a wire: gain 200, at DC as well.
- Reference: 330 kΩ (resistor_4) from +9 V to the − input, against the chip's own input resistance to ground: 1.18 V.
- Input: 22 kΩ (resistor_5) from +9 V onto a 10 kΩ INPUT pot (potentiometer_6) to ground, so the wiper spans 0 to 2.7 V (as built: knob at zero). The wiper feeds the + input through 47 kΩ (resistor_7); 470 kΩ (resistor_8) from the output to the + input is the positive feedback. A voltmeter (voltmeter_9) shows the wiper.
- Red LED (1 kΩ) from the output to ground: lit while the output is high. Green LED (1 kΩ) from +9 V to the output: lit while it is low.

## Observable behaviour
- Knob at zero: output low (0.9 V), green LED on (about 6.1 mA), red off.
- Turn up slowly: nothing changes until the wiper reaches about 2.29 V; then the output snaps high (8.1 V), the red LED comes on (about 6.4 mA) and the green goes out.
- Turn back: the output stays high below 2.29 V and only snaps low again when the wiper falls to about 1.63 V.
- The two switching points are about 0.66 V apart: that gap is the hysteresis.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs`, knob stepped by 0.005: last wiper reading before the upward snap 2.281 V (knob 0.865), before the downward snap 1.641 V (knob 0.6); output 0.901 V / 8.098 V.

## What this verifies
1. Positive feedback turns the amplifier into a Schmitt trigger: the + input sits at a weighted mean of the wiper (0.49) and the output (0.049 per volt), so it switches where that mean crosses 1.18 V — at 2.32 V on the wiper with the output low and at 1.60 V with it high, by hand calculation.
2. The gap between the two switching points comes from the output swing (7.2 V) times the feedback fraction.

## Simulation notes
The LM386's inputs have 50 kΩ to ground and work only a little above ground, so the reference and the switching point both stay near 1–2 V. The wiper reading jumps by a few tens of millivolts when the output snaps, because the feedback current also flows back through the 47 kΩ into the pot.

```assert
# 1 ms after switch-on, knob at zero: output low, green LED lit
net lm386_3.inn V 1.184 +-0.02
net lm386_3.vout V 0.901 +-0.02
net led_13.anode V 2.907 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-schmitt-sweep` prints them one by one.
<!-- engine-provenance -->
