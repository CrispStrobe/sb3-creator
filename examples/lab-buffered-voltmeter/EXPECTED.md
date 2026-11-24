# lab-buffered-voltmeter — expected behaviour

## Circuit
- 9 V, one LM324 (`lm324_3`); sections 3 and 4 are parked.
- The circuit to be measured: a 220 kΩ / 220 kΩ divider (`resistor_4` on top), which on its own gives half the supply.
- The meter: a moving-coil movement of 50 µA with its multiplier for 6 V full scale, so a hundred and twenty kilohms in all.
- Section 1 is a voltage follower. Its + input takes the divider through a silicon diode (protection against a reversed connection), with 10 MΩ to ground to give the diode its tiny current.
- The slide switch (`slide_switch_8`) puts the meter straight on the divider (as loaded) or on the follower's output.
- Section 2 is a ×10 amplifier (91 kΩ back, 10 kΩ to ground) whose input hangs on 1 MΩ to ground. The **probe** button connects it to 0.5 V (82 kΩ / 4.7 kΩ). A second meter (6 V full scale) shows its output.

## Observable behaviour
- Meter straight on the divider: it reads about 2.34 V instead of 4.5 V. Its own resistance in parallel with the lower 220 kΩ pulls the divider down.
- Meter behind the follower: about 4.22 V. The follower takes almost nothing from the divider (which stays near 4.45 V); the reading is short of it by the drop of the protection diode, which carries less than half a microamp.
- ×10 stage with nothing connected: the second meter rests at zero (5 mV, the output's floor).
- **Probe** pressed: 0.49 V in, about 4.9 V on the second meter.
- The simulated op-amp has no input bias current. On a real chip that current, flowing through the 1 MΩ input resistor, would show up ×10 on the second meter with nothing connected, and a real circuit nulls it with a pot; here there is nothing to null, so the bench has no pot.

## What this verifies
1. A meter is part of the circuit it measures: on a high-resistance divider the plain meter reads far too low.
2. A voltage follower has a huge input resistance and a low output resistance, so it hands the voltage to the meter without disturbing the circuit.
3. A non-inverting stage with gain ten turns a voltmeter into a more sensitive one.

```assert
# meter straight on the divider (as loaded): pulled down to 2.34 V; the
# follower's input one diode drop lower; the x10 stage idle
net resistor_4.b V 2.336 +-0.01
net lm324_3.1_pos V 2.134 +-0.02
net lm324_3.2_out V 0.005 +-0.005
```
