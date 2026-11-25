# lab-opamp-doubler — expected behaviour

## Circuit
- 9 V supply, one LM324.
- Section 1: astable (Schmitt trigger, thresholds 3 V / 5.5 V, 47 kΩ into 10 µF, polarized_cap_8); green LED (led_17) on its output. Its capacitor ramps between 3.0 V and 5.4 V.
- Window: 18 kΩ from the positive rail, the WIDTH rheostat (potentiometer_10, 10 kΩ; as built at 0.3), 16 kΩ to ground.
- Section 2: high while the ramp is above the window's bottom; section 3: high while it is below its top.
- Section 4: an op-amp NAND, the two outputs averaged by two 10 kΩ against 5.5 V (10 kΩ / 16 kΩ). Red LED (led_19) on its output.

## Observable behaviour
- The green LED blinks once every 0.67 s. As built, the window runs from 3.5 V to 5.0 V, inside the ramp.
- The red LED blinks twice in the same time: its output goes low only while the ramp is inside the window, and the ramp passes through the window twice per period (once up, once down).
- WIDTH up (no window): both comparators are never high together and the red LED just stays on.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: astable period 673.8 ms, NAND output period half of it; with WIDTH up the NAND output never switches in 2.8 s.

## What this verifies
1. A window comparator plus a NAND tells "inside" from "outside".
2. A ramp that goes up and down crosses a window twice per period: twice the frequency.
3. Logic can be built from op-amp comparators: the average of two outputs is above 5.5 V only when both are high.

## Simulation notes
The window is centred on 4.2 V, not 4.5 V, because the ramp runs between 3.0 V and 5.4 V (the astable's thresholds with its output reaching 7.2 V, not 9 V).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.2_neg V 3.512 +-0.01
net lm324_3.3_pos V 5.049 +-0.01
net lm324_3.4_pos V 5.538 +-0.01
```
