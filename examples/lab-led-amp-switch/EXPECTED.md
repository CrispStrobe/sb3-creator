# lab-led-amp-switch — expected behaviour

## Circuit
- 9 V battery. The sensor is a red LED (led_3) used backwards, with no bias: light drives up to 5 µA out of its anode (`photoSensitivity`, at full light) into the + input of an LM386 (lm386_4). The chip's input resistance to ground turns that current into a voltage (see Simulation notes).
- LEVEL (potentiometer_6, 10 kΩ under 150 kΩ from +9 V, as built at 0.45) sets the − input: 0.233 V as built.
- The LM386 has its gain pins open (gain 20) and 10 µF on BYPASS. Its output follows Vs/2 + 20 × (+ input − − input), DC coupled, inside its swing of 0.9 V to 8.1 V. voltmeter_8 reads it.
- The output drives an NPN (npn_11) through a 10 kΩ / 10 kΩ divider; the NPN switches the yellow lamp LED (led_13) with 390 Ω from +9 V.

## Observable behaviour
- Dark (as built): the sensor sits at 0 V, the output at the bottom of its swing (0.9 V), the lamp is off.
- Light 0.2: 0.05 V at the sensor, output 0.95 V, lamp still off.
- Light 0.3: output 1.46 V, the lamp just starts to glow.
- Light 0.5: 0.125 V at the sensor; after 400 ms the output is at 2.46 V, the lamp half on.
- Light 0.7: after 400 ms the output is at 3.46 V, the transistor saturated, the lamp fully on.
- Full light (1): after 400 ms the output is at 4.96 V.
- Every 0.05 V more at the sensor lifts the output by 1 V: a DC gain of 20.
- LEVEL at position 0.25 (0.134 V on the − input), light 0.5: after 400 ms the output is at 4.41 V and the lamp fully on.
- LEVEL at position 0.65 (0.325 V on the − input), light 0.5: the output stays at 0.9 V and the lamp off.

## Measured on the engine
bw-board 818e0263, bw-circuit-ui 659431ce, `test/lab-circuits-ampic.test.mjs` (settled 400 ms in the dark, then the light stepped every 60 ms): gain 20.02; light 0.4 / 0.6: output 1.960 / 2.961 V; lamp brightness 0.051 at light 0.3, 0.545 at 0.5, 0.868 at 0.7; BYPASS midpoint 4.6 V.

## What this verifies
1. An LED is a photodiode too: its photocurrent becomes a voltage across the amplifier's input resistance.
2. A power-amp IC with ground-referenced, DC-coupled inputs amplifies a slow signal, and a set voltage on its other input is the switching threshold.
3. A transistor after the amplifier switches the load.

## Simulation notes
Like the datasheet, the LM386 model has 50 kΩ from each input to ground, so full light (5 µA) makes 0.25 V at the sensor. The BYPASS capacitor brings the chip's midpoint up over about 0.3 s after switch-on; give the circuit that long before reading. The lamp goes from off to fully on over a range of light (one transistor, no hysteresis).

```assert
# 1 ms after switch-on (the solve assert-physics runs), dark
net potentiometer_6.wiper V 0.233 +-0.005
net lm386_4.vout V 0.9 +-0.02
net npn_11.base V 0.45 +-0.02
net npn_11.collector V 7.705 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **24 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-led-amp-switch` prints them one by one.
<!-- engine-provenance -->
