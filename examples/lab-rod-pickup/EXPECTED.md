# lab-rod-pickup — expected behaviour

## Circuit
- 9 V supply. A ferrite rod (`ferrite_coil_3`, 250 µH main winding, no tuning capacitor): winding end A grounded, end B through 10 nF to the base of the preamp NPN (`npn_10`: 470 kΩ collector-to-base, 4.7 kΩ collector load, emitter grounded).
- The slide switch (`slide_switch_5`) puts 4.7 nF (`capacitor_6`) from the base to ground (right) or leaves it out (left, as authored).
- The field probe (`field_probe_7`) is the learner's hand cupped round the rod (`source: 'body'`, up to 150 pF through a sheet of paper); its knob is the distance.
- 1 µF to the 10 kΩ volume pot (full), the LM386 (`lm386_13`, gain 20), 220 µF into the speaker; a red LED with 470 Ω through 100 µF on the output, a 1N4148 across it for the other half-wave.

## Observable behaviour
- No base capacitor: the stations of the bench broadcast (612 kHz with a 400 Hz tone, 810 kHz two-tone, 1215 kHz 1 kHz) all rectify in the base–emitter junction at once; the amplifier output swings about 1.6 V peak to peak and the 400 Hz station dominates.
- 4.7 nF at the base: the carriers are shorted (34 Ω at 1 MHz); the output falls below a tenth.
- Hand close (capacitor in, so no stations): a 50 Hz hum. 60 ms after switch-on the amplifier output swings about 0.48 V peak to peak with the hand, against about 0.21 V without it (the end of the switch-on transient).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`.

## What this verifies
1. A junction demodulates every carrier that reaches it; selectivity needs a tuned circuit.
2. A small capacitor separates radio frequency from audio.

## Simulation notes
With nothing tuned, the engine solves each station at its own carrier (quasi-statically); the rod picks each up by its effective height. The hand is the engine's body field source: the body sits at a few volts of mains hum behind its capacitances to the wiring and the floor.

```assert
# power-on: supply, the preamp's base on its junction, the LM386's bias
net vsource_2.pos V 9.00 +-0.01
net npn_10.base V 0.68 +-0.02
net lm386_13.bypass V 4.50 +-0.05
net ferrite_coil_3.b V 0.00 +-0.01
```

