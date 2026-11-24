# lab-tilt-table — expected behaviour

## Circuit
- 9 V. One half of an LM358 (`lm358_3`) is an integrator: 100 kΩ from the "tilt" knob into the − input, 2.2 µF from the output back to it. Its + input sits at half the supply (10 kΩ / 10 kΩ). The second half is parked as a grounded follower.
- The tilt knob is a 10 kΩ potentiometer between two 22 kΩ resistors, so its wiper only moves a little either side of half supply.
- The op-amp's output is the "ball". Two end stops watch it:
  - right: an NPN (`npn_13`) whose base hangs on 9.1 kΩ / 1 kΩ from the ball to ground, green LED in its collector;
  - left: a PNP (`pnp_18`) whose base hangs on 9.1 kΩ / 1 kΩ from the ball to +9 V, red LED in its collector.

## Observable behaviour
- Knob in the middle (as loaded): the table is level, the ball stays at half supply (4.5 V) and both LEDs are dark.
- Knob fully right: the ball rolls right at about 3.35 V per second. Past about 7 V the green LED comes on, and the ball comes to rest on the op-amp's output ceiling (about 7.5 V) with the LED at about 6 mA.
- Knob fully left: the ball rolls left at the same speed; below about 2 V the red LED comes on.
- Knob three quarters right: half the tilt, half the speed (about 1.7 V per second).
- Back to level at any point: the ball stops where it is and stays there.

## What this verifies
1. An integrator's output changes at a rate set by its input (input minus the + input, divided by R·C), not to a level set by it.
2. With zero input the integrator holds its value: a memory.
3. A transistor on a divider is a simple threshold detector.

```assert
# level: the knob's wiper, the + input and the ball all at half supply; the
# end-stop bases a tenth of the way from their rail to the ball
net potentiometer_7.wiper V 4.50 +-0.01
net potentiometer_7.a V 3.667 +-0.01
net lm358_3.1_out V 4.50 +-0.01
net npn_13.base V 0.446 +-0.01
net pnp_18.base V 8.554 +-0.01
```
