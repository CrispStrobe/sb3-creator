# lab-function-generator — expected behaviour

## Circuit
9 V, with a 4.5 V reference from two 10 kΩ resistors. One LM358 does both jobs. Integrator: its second half, 1 µF in the
feedback, input resistance 22 kΩ plus a 100 kΩ potentiometer used as a variable resistor (at 0.3, so seven tenths of it are in the circuit).
Comparator: its first half, inverting input on the reference, non-inverting input fed from the integrator through
10 kΩ and from its own output through 22 kΩ (positive feedback = hysteresis). The comparator output drives the
integrator input. Red LED (1 kΩ) on the square output, yellow LED (1 kΩ) on the triangle output.

## Observable behaviour
- The square output switches between about 0 V and 7.2 V; the triangle ramps between about 3.3 V and 6.5 V,
  turning round exactly when the square flips.
- As loaded it runs at about 5.6 Hz. The square is high for about 110 ms of each 178 ms period: the LM358 only
  reaches about 7.2 V, so the ramp is faster one way than the other.
- The red LED blinks hard on and off; the yellow LED swells and fades smoothly with the triangle.
- The potentiometer sets the speed: about 4.2 Hz at one end, about 23 Hz at the other.

## Simulation note
Both stages are halves of the LM358 model, including the integrator with its capacitor in the feedback loop. An earlier
version used the ideal op-amp part for the integrator; with the same components it measured the same frequency and
levels.

## What this verifies
1. An integrator turns a square into a triangle.
2. A Schmitt trigger turns the triangle back into a square at two fixed levels — together they oscillate.

```assert
# t = 1 ms: reference 4.5 V, integrator just starting from it, square low
net resistor_3.b V 4.50 +-0.01
net lm358_5.2_out V 4.55 +-0.05
net lm358_5.1_out V 0.02 +-0.05
```
