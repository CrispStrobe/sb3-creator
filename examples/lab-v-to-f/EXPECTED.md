# lab-v-to-f — expected behaviour

## Circuit
9 V. Two 10 kΩ resistors and a follower (one half of a first LM358) make a stiff 4.5 V reference. The input is a
10 kΩ potentiometer between +9 V and that reference, so the input can sit anywhere between 0 V and 4.5 V above it.
Integrator: one half of a second LM358, 100 kΩ input resistor, 2.2 µF feedback capacitor, its non-inverting input on the reference. Schmitt trigger: the other half,
inverting input on the reference, non-inverting input fed from the integrator through 10 kΩ and from its own output
through 47 kΩ. Reset path: a diode from the integrator's input node through 15 kΩ to the trigger output. A green LED with
1 kΩ from +9 V into the trigger output flashes while the output is low.

## Observable behaviour
- The input voltage makes the integrator ramp down steadily. At about 3.9 V the trigger output drops: the diode pulls
  current out of the integrator, which ramps quickly back up to about 5.4 V, the trigger flips back, and the LED has
  flashed once (about 15 to 18 ms).
- The higher the input, the faster the ramp, the more flashes per second:

| input above reference | flashes per second |
|---|---|
| 0 V | 0 |
| 0.89 V | 2.55 Hz |
| 1.76 V | 4.86 Hz |
| 2.64 V | 6.99 Hz |
| 3.54 V | 8.98 Hz |
| 4.50 V | 10.84 Hz |

- About 3 flashes per second per volt, almost a straight line; it bends a little at the top because each reset takes
  a fixed few milliseconds that the slow ramp does not.
- As loaded (pot at 0.4) the input is about 1.76 V above the reference.
- Count flashes for one second and you have measured the voltage — a home-made ADC.

## Simulation note
All three stages use the LM358 model. An earlier version used the ideal op-amp part for the reference and the integrator;
with the same components it measured the same rates (within 0.01 Hz).

## What this verifies
1. Integrator slope is proportional to the input voltage.
2. A fixed ramp height turns the slope into a frequency proportional to the input.

```assert
net lm358_5.1_out V 4.50 +-0.01
net potentiometer_7.wiper V 6.26 +-0.02
```
