# lab-ramp-timer — expected behaviour

## Circuit
- 9 V, one LM324 (`lm324_3`). A 20k/20k/20k/20k/10k ladder from 9 V gives 7, 5, 3 and 1 V.
- Section 1 integrates onto 4.7 µF; its + input is on the 1 V tap.
- The input resistor is 47 kΩ plus a 220 kΩ "time" rheostat (as loaded at zero, the fastest setting). A hold/run slide switch (`slide_switch_6`) connects it either to the 1 V tap (hold) or to ground (run, as loaded).
- **Zero**: a button with 100 Ω across the capacitor.
- Sections 2, 3 and 4 are comparators: + input on the ramp, − input on the 3 V, 5 V and 7 V taps. Each output lights its LED (green, yellow, red) through 1 kΩ.

## Observable behaviour
- Run (as loaded): the output climbs from about 1 V in a straight line; at the fastest setting it takes about 1.5 s to reach the top.
- Green comes on after about 0.45 s, yellow after about 0.9 s, red after about 1.35 s: the three thresholds are equally spaced in voltage, and on a straight ramp that makes them equally spaced in time.
- Switch to hold: the ramp stops where it is and the lit LEDs stay lit.
- **Zero**: back to the start, all LEDs dark. Switch back to run and it starts again.
- Time knob at half (157 kΩ in all): a third of the speed; fully slow (267 kΩ) about a sixth.

## What this verifies
1. A constant input current into an integrator gives a ramp, a straight line in time.
2. Thresholds on a straight ramp are equally spaced marks of time: a timer.
3. The ramp speed is the input voltage divided by R·C.

```assert
# 1 ms after switch-on, running: the ladder taps, the output already a few
# millivolts above its 1 V start, the first comparator still low
net lm324_3.1_pos V 1.000 +-0.002
net lm324_3.2_neg V 3.002 +-0.002
net lm324_3.4_neg V 7.000 +-0.002
net lm324_3.1_out V 1.0045 +-0.0015
net lm324_3.2_out V 0.005 +-0.01
```
