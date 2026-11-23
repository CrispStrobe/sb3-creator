# lab-function-generator — expected behaviour

## Circuit
9 V, with a 4.5 V reference from two 10 kΩ resistors. Integrator: ideal op-amp part (output 0 to 9 V), 1 µF in the
feedback, input resistance 22 kΩ plus a 100 kΩ potentiometer used as a variable resistor (at 0.3, so seven tenths of it are in the circuit).
Comparator: one half of an LM358, inverting input on the reference, non-inverting input fed from the integrator through
10 kΩ and from its own output through 22 kΩ (positive feedback = hysteresis). The comparator output drives the
integrator input. Red LED (1 kΩ) on the square output, yellow LED (1 kΩ) on the triangle output.

## Observable behaviour
- The square output switches between about 0 V and 7 V; the triangle ramps between about 3.35 V and 6.6 V,
  turning round exactly when the square flips.
- As loaded it runs at about 5.4 Hz. The square is high for about 119 ms of each 185 ms period: the LM358 only
  reaches about 7 V, so the ramp is faster one way than the other.
- The red LED blinks hard on and off; the yellow LED swells and fades smoothly with the triangle.
- The potentiometer sets the speed: about 4.1 Hz at one end, about 22 Hz at the other.

## Simulation note
The integrator uses the ideal op-amp part: the LM358 model stalls with a capacitor in its feedback loop.
The comparator uses the LM358, whose snap with positive feedback the simulator follows; the ideal part's does not.

## What this verifies
1. An integrator turns a square into a triangle.
2. A Schmitt trigger turns the triangle back into a square at two fixed levels — together they oscillate.

```assert
# t = 1 ms: reference 4.5 V, integrator just starting from it, square low
net resistor_3.b V 4.50 +-0.01
net opamp_5.out V 4.55 +-0.05
net lm358_6.1_out V 0.02 +-0.05
```
