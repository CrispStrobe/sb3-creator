# lab-coil-audio-link — expected behaviour

## Circuit
- 9 V supply. A function generator (`function_gen_3`, 1 kHz sine, 10 mV peak) stands for a radio's speaker output. It drives the 10 mH winding of `transformer_4` (output from its 40 mH winding) and the 40 mH winding of `transformer_5` (output from its 10 mH winding), both k = 0.9.
- The slide switch (`slide_switch_6`) passes one output through 220 nF to the base of the preamp (`npn_10`: 470 kΩ collector-to-base, 4.7 kΩ collector load, 100 Ω emitter resistor).
- 1 µF to a 10 kΩ volume pot (set to 0.2), the LM386 (gain 20), 220 µF into the speaker.

## Observable behaviour
- Left (stepped up): about 25 mV peak to peak at the preamp's base, 3.0 V at the amplifier output.
- Right (stepped down): about 6.3 mV at the base, about 0.76 V at the output: a factor of about 3.9 between the two.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`.

## What this verifies
1. A transformer carries audio between windings that are not connected.
2. The voltage ratio follows the turns ratio (√(L2/L1) = 2 each way, so 4 between the two positions).

## Simulation notes
Two transformers wired the two ways round stand for one transformer whose windings are swapped (that needs a double-pole switch). The windings have no resistance and the core no losses.

```assert
# power-on: supply and the LM386's bias
net vsource_2.pos V 9.00 +-0.01
net lm386_14.bypass V 4.50 +-0.05
net npn_10.emitter V 0.00 +-0.01
```

